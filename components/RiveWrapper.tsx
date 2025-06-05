'use client';

import { useEffect, useRef } from 'react';
import { useRive, useStateMachineInput, Rive } from '@rive-app/react-canvas';

interface InteractionInput {
  inputName: string;
  inputType: 'boolean' | 'trigger' | 'number';
  event: 'hover' | 'click' | 'scroll' | 'custom';
  value?: number;
}

interface Props {
  src: string;
  stateMachine?: string;
  interactionInputs?: InteractionInput[];
  className?: string;
  autoplay?: boolean;
  onLoad?: (rive: Rive) => void;
  onError?: (error: Error) => void;
}

const RiveWrapper = ({
  src,
  stateMachine,
  interactionInputs = [],
  className,
  autoplay = true,
  onLoad,
  onError,
}: Props) => {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine ? [stateMachine] : undefined,
    autoplay,
    onLoad: () => onLoad?.(rive!),
    // onError is not a valid property for useRive options
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Store input controllers
  const inputs = interactionInputs.map((input) => ({
    ...input,
    controller: useStateMachineInput(rive, stateMachine, input.inputName),
  }));

  // Handle interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !rive) return;

    const handleInteraction = (input: typeof inputs[number], value?: any) => {
      const { controller, inputType } = input;
      if (!controller) return;

      if (inputType === 'boolean') {
        controller.value = value;
      } else if (inputType === 'trigger') {
        if (typeof controller.fire === 'function') {
          controller.fire();
        } else {
          controller.value = true; // Fallback for triggers
        }
      } else if (inputType === 'number') {
        controller.value = value ?? input.value ?? 0;
      }
    };

    const listeners: Array<() => void> = [];

    inputs.forEach((input) => {
      if (input.event === 'hover') {
        const onMouseEnter = () => handleInteraction(input, true);
        const onMouseLeave = () => handleInteraction(input, false);
        container.addEventListener('mouseenter', onMouseEnter);
        container.addEventListener('mouseleave', onMouseLeave);
        listeners.push(
          () => container.removeEventListener('mouseenter', onMouseEnter),
          () => container.removeEventListener('mouseleave', onMouseLeave)
        );
      } else if (input.event === 'click') {
        const onClick = () => handleInteraction(input);
        container.addEventListener('click', onClick);
        listeners.push(() => container.removeEventListener('click', onClick));
      } else if (input.event === 'scroll') {
        const onScroll = () => {
          const rect = container.getBoundingClientRect();
          const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
          handleInteraction(input, isInViewport ? 1 : 0); // Example: number input for scroll
        };
        window.addEventListener('scroll', onScroll);
        listeners.push(() => window.removeEventListener('scroll', onScroll));
      }
      // Add support for custom events if needed
    });

    return () => listeners.forEach((cleanup) => cleanup());
  }, [rive, inputs]);

  return (
    <div
      ref={containerRef}
      className={className}
      tabIndex={0}
      role="img"
      aria-label="Animated illustration"
      style={{ outline: 'none' }}
    >
      <RiveComponent />
    </div>
  );
};

export default RiveWrapper;