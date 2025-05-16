import Header from "@/components/header";
import Footer from "@/components/footer";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { VisualEditing } from "next-sanity";
import { draftMode } from "next/headers";
import { SanityLive } from "@/sanity/lib/live";
import { CookieConsent } from '@/components/blocks/CookieConsent';
import Head from "next/head";
import { Toaster } from 'sonner';


export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </Head>

      <Header />
      <main>{children}<Toaster richColors position="top-center" />
      <script
        src="https://checkout.razorpay.com/v1/checkout.js"
        async
      ></script>
      </main>
      <SanityLive />
      {(await draftMode()).isEnabled && (
        <>
          <DisableDraftMode />
          <VisualEditing />
        </>
      )}
      <Footer />
      <CookieConsent />
    </>
  );
}
