import React, { useContext, useMemo } from 'react';
import { LanguageContext } from '../main';

const AppDownloadBanner = () => {
  const { language } = useContext(LanguageContext);
  const isHindi = language === 'hi';
  const downloadPath = '/downloads/sanjeevani-latest.apk';
  const qrRedirectUrl = 'https://drive.google.com/drive/folders/1uazEFj2aOgFznSG0LP00XaufRxeHSYXx?usp=sharing';
  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrRedirectUrl)}`;
  }, [qrRedirectUrl]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-rose-100 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.08),transparent_45%),linear-gradient(135deg,#fdf6f8_0%,#fff9fb_45%,#f9fcff_100%)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-1 text-xs font-bold tracking-[0.12em] text-rose-700">
            {isHindi ? 'एंड्रॉइड ऐप डाउनलोड' : 'DOWNLOAD ON ANDROID'}
          </p>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            {isHindi ? 'ऐप अभी डाउनलोड करें!' : 'Download the app now!'}
          </h3>
          <p className="mt-3 text-lg leading-8 text-slate-600 md:text-[1.75rem] md:leading-[2.4rem]">
            {isHindi
              ? 'अपॉइंटमेंट, रिपोर्ट और हेल्थ फीचर्स अब मोबाइल ऐप पर आसानी से पाएँ।'
              : 'Experience seamless health services with the Sanjeevani mobile app.'}
          </p>
          <a
            href={downloadPath}
            download
            className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-7 py-3 text-base font-bold text-white transition hover:bg-slate-800"
          >
            {isHindi ? 'Download Now' : 'Download Now'}
          </a>
        </div>

        <div className="mx-auto w-full max-w-[320px] rounded-[2.2rem] border-4 border-slate-800 bg-white p-5 shadow-[0_20px_45px_rgba(15,23,42,0.2)] lg:mx-0">
          <p className="mb-3 text-center text-lg font-bold leading-7 text-slate-600">
            {isHindi ? 'QR स्कैन करें और ऐप डाउनलोड करें' : 'Scan the QR code to download the app'}
          </p>
          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <div className="mx-auto w-fit">
              <img src={qrImageUrl} alt="APK download QR" className="h-[220px] w-[220px]" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadBanner;
