"use client";
import Pic1 from '@/public/pic1Home.png'
import { FileQuestionMark } from 'lucide-react'
import Link from "next/link"
import { useTranslations } from 'next-intl'
import LocaleSwitcher from '@/src/components/localeSwitcher';


const LandingPage = () => {
  const t = useTranslations('landing')   // loads translations from the "landing" namespace

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">

      {/* Glow blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-pink-500 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <h1 className="text-xl font-semibold text-purple-400">{t('brand')}</h1>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="#how" className="hover:text-white transition-colors text-[20px] flex gap-2">
            {t('howItWorks')} <span><FileQuestionMark /></span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/auth/login">
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              {t('signIn')}
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-300 text-black text-sm font-semibold">
              {t('getStarted')}
            </button>
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
          {t('badge')}
        </p>
        <h2 className="text-5xl font-semibold leading-tight max-w-2xl mb-6">
          {t('title')}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
            {t('titleGradient')}
          </span>
        </h2>
        <p className="text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
          {t('subtitle')}
        </p>
        <div className="flex items-center gap-3">
          <Link href="/auth/register">
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-300 text-black font-semibold text-sm">
              {t('getStarted')}
            </button>
          </Link>
          <Link href="#features">
            <button className="px-6 py-3 rounded-full bg-gray-800 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
              {t('learnMore')}
            </button>
          </Link>
        </div>

        <img src={Pic1.src} className="w-60" alt="Aether" />
        <div className="mt-16 flex gap-10 text-center">
          <div>
            <p className="text-2xl font-semibold text-white">12k+</p>
            <p className="text-xs text-gray-500 mt-1">{t('statsCandidates')}</p>
          </div>
          <div className="border-l border-gray-800"></div>
          <div>
            <p className="text-2xl font-semibold text-white">340+</p>
            <p className="text-xs text-gray-500 mt-1">{t('statsOrgs')}</p>
          </div>
          <div className="border-l border-gray-800"></div>
          <div>
            <p className="text-2xl font-semibold text-white">98%</p>
            <p className="text-xs text-gray-500 mt-1">{t('statsMatchRate')}</p>
          </div>
        </div>
      </section>

      <section className="px-10 py-20">
        <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-2">{t('whatWeOfferBadge')}</p>
        <h3 className="text-2xl font-semibold text-center mb-12">{t('whatWeOfferTitle')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          <div className="bg-[#111] rounded-3xl p-6 shadow-2xl border border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-purple-500 bg-opacity-20 flex items-center justify-center mb-4">
              <p>1</p>
            </div>
            <h4 className="text-sm font-semibold mb-2">{t('feature1Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('feature1Text')}
            </p>
          </div>

          <div className="bg-[#111] rounded-3xl p-6 shadow-2xl border border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-pink-500 bg-opacity-20 flex items-center justify-center mb-4">
              <p>2</p>
            </div>
            <h4 className="text-sm font-semibold mb-2">{t('feature2Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('feature2Text')}
            </p>
          </div>

          <div className="bg-[#111] rounded-3xl p-6 shadow-2xl border border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-purple-500 bg-opacity-20 flex items-center justify-center mb-4">
              <p>3</p>
            </div>
            <h4 className="text-sm font-semibold mb-2">{t('feature3Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('feature3Text')}
            </p>
          </div>

          <div className="bg-[#111] rounded-3xl p-6 shadow-2xl border border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-pink-500 bg-opacity-20 flex items-center justify-center mb-4">
              <p>4</p>
            </div>
            <h4 className="text-sm font-semibold mb-2">{t('feature4Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('feature4Text')}
            </p>
          </div>

          <div className="bg-[#111] rounded-3xl p-6 shadow-2xl border border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-purple-500 bg-opacity-20 flex items-center justify-center mb-4">
              <p>5</p>
            </div>
            <h4 className="text-sm font-semibold mb-2">{t('feature5Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('feature5Text')}
            </p>
          </div>

          <div className="bg-[#111] rounded-3xl p-6 shadow-2xl border border-gray-800">
            <div className="w-9 h-9 rounded-xl bg-pink-500 bg-opacity-20 flex items-center justify-center mb-4">
              <p>6</p>
            </div>
            <h4 className="text-sm font-semibold mb-2">{t('feature6Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('feature6Text')}
            </p>
          </div>
        </div>
      </section>

      <section id="how" className="px-10 py-20 border-t border-gray-800">
        <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-2">{t('howItWorksBadge')}</p>
        <h3 className="text-2xl font-semibold text-center mb-12">{t('howItWorksTitle')}</h3>

        <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
          <div className="flex-1 bg-[#111] rounded-3xl p-6 border border-gray-800 text-center">
            <p className="text-3xl font-semibold text-purple-400 mb-3">01</p>
            <h4 className="text-sm font-semibold mb-2">{t('step1Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('step1Text')}
            </p>
          </div>
          <div className="flex-1 bg-[#111] rounded-3xl p-6 border border-gray-800 text-center">
            <p className="text-3xl font-semibold text-purple-400 mb-3">02</p>
            <h4 className="text-sm font-semibold mb-2">{t('step2Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('step2Text')}
            </p>
          </div>
          <div className="flex-1 bg-[#111] rounded-3xl p-6 border border-gray-800 text-center">
            <p className="text-3xl font-semibold text-purple-400 mb-3">03</p>
            <h4 className="text-sm font-semibold mb-2">{t('step3Title')}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('step3Text')}
            </p>
          </div>
        </div>
      </section>

      <section className="px-10 py-20">
        <div className="bg-[#111] rounded-3xl p-12 shadow-2xl border border-gray-800 max-w-3xl mx-auto text-center relative overflow-hidden">
          <h3 className="text-2xl font-semibold mb-3">
            {t('ctaTitle')}
          </h3>
          <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">
            {t('ctaText')}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/auth/register">
              <button className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-300 text-black font-semibold text-sm">
                {t('getStarted')}
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="px-6 py-3 rounded-full bg-gray-800 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                {t('signIn')}
              </button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-10 py-8 border-t border-gray-800 flex items-center justify-between">
        <p className="text-purple-400 font-semibold">{t('footerBrand')}</p>
        <p className="text-xs text-gray-500">{t('footerTagline')}</p>
        <p className="text-xs text-gray-600">{t('footerRights')}</p>
      </footer>

    </div>
  )
}

export default LandingPage