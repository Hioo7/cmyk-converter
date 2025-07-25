import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Professional CMYK Converter - High-Quality Image Conversion',
  description: 'Convert JPG, JPEG, and PNG images to CMYK format with professional-grade quality. Perfect for print preparation and professional photography workflows.',
  keywords: 'CMYK converter, image conversion, print preparation, color space conversion, professional photography',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}