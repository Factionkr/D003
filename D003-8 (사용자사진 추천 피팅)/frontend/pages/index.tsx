import type { NextPage } from 'next'
import Head from 'next/head'
import Header from '@/components/Header'
import CanvasViewer from '@/components/CanvasViewer'
import ControlPanel from '@/components/ControlPanel'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI 가상 피팅 스튜디오</title>
        <meta name="description" content="내 체형과 퍼스널 스타일에 맞춘 실시간 AI 착장 렌더링" />
      </Head>
      <div className="min-h-screen bg-primaryBg text-neutralDark font-sans">
        <Header />
        <main className="flex flex-col md:flex-row gap-4 p-4">
          <section className="flex-1">
            <CanvasViewer />
          </section>
          <aside className="w-full md:w-96">
            <ControlPanel />
          </aside>
        </main>
      </div>
    </>
  )
}

export default Home

