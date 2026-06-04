import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6 max-w-7xl mx-auto"
            >
              <Outlet />
              <footer className="mt-10 border-t border-border pt-5 text-center text-xs font-medium text-muted-foreground">
                Built by{' '}
                <a
                  href="https://faizhussain.netlify.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  Faiz Hussain
                </a>
              </footer>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
