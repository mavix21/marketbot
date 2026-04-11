import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Delfos Bot",
  description: "Privacy Policy for Delfos Bot WhatsApp service",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 11, 2025";
  const contactEmail = "privacy@delfosbot.app";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: {lastUpdated}</p>

        {/* 1. Introduction */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            Delfos Bot (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates a
            WhatsApp-based service that allows users to explore and participate in prediction
            markets powered by Kalshi, using blockchain technology, directly from WhatsApp.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you interact with our WhatsApp bot service. Please read this policy
            carefully. By using Delfos Bot, you agree to the collection and use of information in
            accordance with this policy.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>

          <h3 className="text-lg font-medium">2.1 Information You Provide Directly</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>WhatsApp Profile Information:</strong> Your phone number, display name, and
              profile picture as provided through the WhatsApp Business API.
            </li>
            <li>
              <strong>Messages and Interactions:</strong> The content of messages you send to our
              bot, including queries about prediction markets, betting instructions, and any other
              communications.
            </li>
            <li>
              <strong>Blockchain Wallet Information:</strong> Wallet addresses and transaction
              identifiers necessary to facilitate your participation in prediction markets.
            </li>
          </ul>

          <h3 className="text-lg font-medium">2.2 Information Collected Automatically</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Usage Data:</strong> Interaction timestamps, frequency of use, types of
              markets viewed, and commands issued.
            </li>
            <li>
              <strong>Technical Data:</strong> Device identifiers and metadata provided by the
              WhatsApp Business API.
            </li>
          </ul>
        </section>

        {/* 3. How We Use Your Information */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Service Delivery:</strong> To process your requests, display prediction market
              data from Kalshi, and facilitate blockchain-based transactions.
            </li>
            <li>
              <strong>Communication:</strong> To respond to your inquiries and send service-related
              notifications via WhatsApp.
            </li>
            <li>
              <strong>Improvement:</strong> To analyze usage patterns and improve the functionality
              and user experience of our bot.
            </li>
            <li>
              <strong>Security:</strong> To detect, prevent, and address technical issues, fraud, or
              abuse.
            </li>
            <li>
              <strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and
              legal processes.
            </li>
          </ul>
        </section>

        {/* 4. Data Sharing and Disclosure */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">4. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal information. We may share your data with the following
            parties only as necessary:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Meta / WhatsApp:</strong> Your interactions are processed through the WhatsApp
              Business API, subject to{" "}
              <a
                href="https://www.whatsapp.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                WhatsApp&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Kalshi:</strong> Market data queries and relevant information are exchanged
              with Kalshi&apos;s platform to provide prediction market data.
            </li>
            <li>
              <strong>Blockchain Networks:</strong> Transaction data is recorded on public
              blockchain networks, which are inherently transparent and immutable.
            </li>
            <li>
              <strong>Legal Authorities:</strong> We may disclose your information if required by
              law, regulation, legal process, or governmental request.
            </li>
            <li>
              <strong>Service Providers:</strong> Trusted third-party providers who assist us in
              operating our service, subject to confidentiality obligations.
            </li>
          </ul>
        </section>

        {/* 5. Data Retention */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">5. Data Retention</h2>
          <p>
            We retain your personal information only for as long as necessary to fulfill the
            purposes outlined in this policy, unless a longer retention period is required or
            permitted by law. Conversation logs are retained for a maximum of 90 days for service
            improvement purposes, after which they are anonymized or deleted.
          </p>
        </section>

        {/* 6. Data Security */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction.
            However, no method of transmission over the Internet or electronic storage is 100%
            secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* 7. Your Rights */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the following rights regarding your
            personal data:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Access:</strong> Request a copy of the personal data we hold about you.
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or incomplete data.
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal data, subject to legal
              obligations.
            </li>
            <li>
              <strong>Restriction:</strong> Request that we restrict the processing of your data.
            </li>
            <li>
              <strong>Portability:</strong> Request transfer of your data to another service.
            </li>
            <li>
              <strong>Objection:</strong> Object to the processing of your data for certain
              purposes.
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {contactEmail}
            </a>
            .
          </p>
        </section>

        {/* 8. Third-Party Services */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">8. Third-Party Services</h2>
          <p>Our service integrates with the following third-party platforms:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>WhatsApp Business API (Meta):</strong> For messaging infrastructure.
            </li>
            <li>
              <strong>Kalshi:</strong> For prediction market data and functionality.
            </li>
            <li>
              <strong>Blockchain Networks:</strong> For transaction processing and settlement.
            </li>
          </ul>
          <p>
            Each third-party service has its own privacy policy governing the use of your data. We
            encourage you to review their respective policies.
          </p>
        </section>

        {/* 9. International Data Transfers */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your
            country of residence. These countries may have data protection laws that differ from
            those in your jurisdiction. We take appropriate safeguards to ensure your data remains
            protected in accordance with this policy.
          </p>
        </section>

        {/* 10. Children's Privacy */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">10. Children&apos;s Privacy</h2>
          <p>
            Our service is not directed to individuals under the age of 18. We do not knowingly
            collect personal information from children. If you become aware that a child has
            provided us with personal data, please contact us so we can take appropriate action.
          </p>
        </section>

        {/* 11. Changes to This Policy */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material
            changes by posting the new policy on this page and updating the &quot;Last updated&quot;
            date. Continued use of the service after changes constitutes acceptance of the revised
            policy.
          </p>
        </section>

        {/* 12. Contact Us */}
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">12. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices,
            please contact us at:
          </p>
          <ul className="list-none space-y-1 pl-0">
            <li>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {contactEmail}
              </a>
            </li>
          </ul>
        </section>

        <hr className="my-8" />
        <p className="text-muted-foreground text-sm">
          This privacy policy is provided in compliance with Meta&apos;s WhatsApp Business Platform
          requirements and applicable data protection regulations.
        </p>
      </article>
    </div>
  );
}
