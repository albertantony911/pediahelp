import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define the expected shape of the form data
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming request body
    const body: ContactFormData = await req.json();

    // Basic validation
    if (!body.name || !body.email || !body.phone || !body.message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format (basic regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate phone format (matches the format used in the form: +[country code][10-digit number])
    const phoneRegex = /^\+\d{1,3}\d{10}$/;
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Store the submission in Firestore
    const submission = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      submittedAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'contact-submissions'), submission);

    return NextResponse.json(
      { message: 'Form submitted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}