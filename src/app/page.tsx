import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">VibeChat</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            <Link href="#features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              How It Works
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="default" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="primary" size="sm">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Connect with friends through secure chats
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              VibeChat lets you connect with friends and family through simple,
              secure, and feature-rich conversations. Share messages, photos, and
              stay connected with those who matter.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/auth/signup">
                <Button variant="primary" size="lg">
                  Get Started
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="secondary" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-blue-600 dark:bg-blue-700 p-4 text-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="ml-2 font-medium">VibeChat</div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">A</div>
                    <div className="ml-3">
                      <div className="font-medium dark:text-white">Alex</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Online</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-lg p-3 max-w-xs dark:text-white">
                        <p className="text-sm">Hey! How are you doing today?</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-blue-600 rounded-lg p-3 max-w-xs text-white">
                        <p className="text-sm">Hi Alex! I&apos;m doing great, thanks for asking.</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-lg p-3 max-w-xs dark:text-white">
                        <p className="text-sm">Do you want to grab lunch tomorrow?</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">User Invitations</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with friends by sharing your user ID. Accept or decline chat invitations based on your preferences.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Media Sharing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share images and photos with your contacts within your conversations. Express yourself visually.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Message Quotes</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Reply to specific messages in a conversation with quote functionality. Keep your chats organized and contextual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create an account with your email and password to get started.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Share Your ID</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share your user ID with friends who you want to chat with.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Start Chatting</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Once your friend accepts your invitation, begin messaging and sharing media.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="font-bold text-xl">VibeChat</span>
              <p className="text-gray-400 text-sm mt-1">
                Connect. Chat. Share.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login" className="text-gray-300 hover:text-white">
                Login
              </Link>
              <Link href="/auth/signup" className="text-gray-300 hover:text-white">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
