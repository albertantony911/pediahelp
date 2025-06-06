'use client';

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/logo';
import { urlFor } from '@/sanity/lib/image';
import PortableTextRenderer from '@/components/portable-text-renderer';
import { PAGE_QUERYResult } from '@/sanity.types';
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer';
import { Button } from '@/components/ui/button';
import { Theme } from '@/components/ui/theme/Theme';
import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import { useDoctors } from '@/components/providers/DoctorsProvider';
import dynamic from 'next/dynamic';
import type { Doctor } from '@/types';

const RiveComponent = dynamic(() => import('@/components/RiveWrapper'), { ssr: false });

type LayoutOption = 'image-left' | 'image-right' | null;

interface InteractionInput {
  inputName: string;
  inputType: 'boolean' | 'trigger' | 'number';
  event: 'hover' | 'click' | 'scroll' | 'custom';
  value?: number;
}

type Hero1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number],
  { _type: 'hero-1' }
> & {
  riveAnimation?: { asset?: { url: string } } | null;
  stateMachines?: string[] | null;
  defaultStateMachine?: string | null;
  interactionInputs?: InteractionInput[] | null;
};

const Hero1: React.FC<Hero1Props> = ({
  theme,
  layout = 'image-right',
  reverseOnMobile = false,
  tagLine,
  title,
  body,
  image,
  showButton,
  buttonType,
  customButton,
  riveAnimation,
  stateMachines,
  defaultStateMachine,
  interactionInputs,
}) => {
  const isImageLeftDesktop = layout === 'image-left';
  const isImageLeftMobile = reverseOnMobile ? !isImageLeftDesktop : isImageLeftDesktop;
  const allDoctors = useDoctors();

  return (
    <Theme variant={theme || 'dark-shade'}>
      {/* Mobile-only SVG Logo */}
      <div className="lg:hidden">
        <Logo />
      </div>
      <div className="flex flex-col">
        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:pt-28 pt-5">
          {/* === Mobile layout === */}
          <div className={`contents lg:hidden ${isImageLeftMobile ? 'order-first' : 'order-last'}`}>
            {isImageLeftMobile && (
              <ImageBlock
                image={image}
                riveAnimation={riveAnimation}
                stateMachines={stateMachines}
                defaultStateMachine={defaultStateMachine}
                interactionInputs={interactionInputs}
              />
            )}
            <TextBlock
              tagLine={tagLine}
              title={title}
              body={body}
              showButton={showButton}
              buttonType={buttonType}
              customButton={customButton}
              allDoctors={allDoctors}
            />
            {!isImageLeftMobile && (
              <ImageBlock
                image={image}
                riveAnimation={riveAnimation}
                stateMachines={stateMachines}
                defaultStateMachine={defaultStateMachine}
                interactionInputs={interactionInputs}
              />
            )}
          </div>

          {/* === Desktop layout === */}
          <div className="hidden lg:contents">
            {isImageLeftDesktop && (
              <ImageBlock
                image={image}
                riveAnimation={riveAnimation}
                stateMachines={stateMachines}
                defaultStateMachine={defaultStateMachine}
                interactionInputs={interactionInputs}
              />
            )}
            <TextBlock
              tagLine={tagLine}
              title={title}
              body={body}
              showButton={showButton}
              buttonType={buttonType}
              customButton={customButton}
              allDoctors={allDoctors}
            />
            {!isImageLeftDesktop && (
              <ImageBlock
                image={image}
                riveAnimation={riveAnimation}
                stateMachines={stateMachines}
                defaultStateMachine={defaultStateMachine}
                interactionInputs={interactionInputs}
              />
            )}
          </div>
        </div>
      </div>
    </Theme>
  );
};

const ImageBlock: React.FC<{
  image: any | null;
  riveAnimation?: { asset?: { url: string } } | null;
  stateMachines?: string[] | null;
  defaultStateMachine?: string | null;
  interactionInputs?: InteractionInput[] | null;
}> = ({ image, riveAnimation, stateMachines, defaultStateMachine, interactionInputs }) => {
  if (riveAnimation?.asset?.url && defaultStateMachine) {
    return (
      <div className="flex flex-col justify-center w-full aspect-square m-0 p-0 max-sm:-mx-10 max-sm:w-[calc(100%+5rem)]">
        <RiveComponent
          src={riveAnimation.asset.url}
          stateMachine={defaultStateMachine}
          interactionInputs={interactionInputs || []}
          className="w-full h-full rounded-xl animate-fade-up [animation-delay:500ms] opacity-0"
          onLoad={(rive) => console.log('Rive animation loaded:', rive)}
          onError={(error) => console.error('Rive animation error:', error)}
        />
      </div>
    );
  }

  if (image?.asset?._id) {
    return (
      <div className="flex flex-col justify-center w-full max-sm:-mx-10 max-sm:w-[calc(100%+5rem)] m-0 p-0">
        <Image
          className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0"
          src={urlFor(image).url()}
          alt={image.alt || ''}
          width={image.asset?.metadata?.dimensions?.width || 800}
          height={image.asset?.metadata?.dimensions?.height || 800}
          placeholder={image?.asset?.metadata?.lqip ? 'blur' : undefined}
          blurDataURL={image?.asset?.metadata?.lqip || ''}
          quality={100}
        />
      </div>
    );
  }

  return null;
};

const TextBlock: React.FC<{
  tagLine?: string | null;
  title?: string | null;
  body?: any[] | null;
  showButton?: boolean | null;
  buttonType?: string | null;
  customButton?: { label: string | null; link: string | null; isExternal: boolean | null } | null;
  allDoctors: Doctor[];
}> = ({
  tagLine,
  title,
  body,
  showButton,
  buttonType,
  customButton,
  allDoctors,
}) => {
  return (
    <div className="flex flex-col justify-center text-left">
      {tagLine && <Subtitle>{tagLine}</Subtitle>}
      {title && <Title>{title}</Title>}
      {body && (
        <Content as="div">
          <PortableTextRenderer value={body} />
        </Content>
      )}
      {showButton && (
        <div className="mt-4 animate-fade-up [animation-delay:400ms] opacity-0">
          {buttonType === 'primaryCTA' ? (
            <DoctorSearchDrawer allDoctors={allDoctors}>
              <Button variant="secondary">Book an Appointment</Button>
            </DoctorSearchDrawer>
          ) : (
            customButton &&
            customButton.label &&
            customButton.link && (
              <Button variant="secondary" asChild>
                {customButton.isExternal ? (
                  <a href={customButton.link} target="_blank" rel="noopener noreferrer">
                    {customButton.label}
                  </a>
                ) : (
                  <Link href={customButton.link}>{customButton.label}</Link>
                )}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Hero1;