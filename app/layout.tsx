import "../styles/globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interviewquest - AI-Powered Mock Interviews",
  openGraph: {
    title: "Interviewquest - AI-Powered Mock Interviews",
    description:
      "Interviewquest is an AI-powered mock interview platform that helps you practice for your next job interview.",
    images: [
      {
        url: "https://demo.useliftoff.com/opengraph-image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interviewquest - AI-Powered Mock Interviews",
    description:
      "Interviewquest is an AI-powered mock interview platform that helps you practice for your next job interview.",
    images: ["https://demo.useliftoff.com/opengraph-image"],
    creator: "@tmeyer_me",
  },
  themeColor: "#FFF",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scroll-smooth antialiased [font-feature-settings:'ss01']">
        {children}
      </body>
    </html>
  );
}
