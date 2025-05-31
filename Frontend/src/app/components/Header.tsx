"use client";
import Link from "next/link";
import Image from "next/image";
import { FaChevronLeft, FaHeadphones, FaCopy, FaTimes, FaPlay, FaLinkedin, FaChevronDown } from "react-icons/fa";
import { useState } from "react";

interface HeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  backText?: string;
}

interface DemoFormData {
  firstName: string;
  lastName: string;
  businessEmail: string;
  phoneNumber: string;
  companyName: string;
  businessCardTitle: string;
  firmDescription: string;
}

const initialDemoForm: DemoFormData = {
  firstName: '',
  lastName: '',
  businessEmail: '',
  phoneNumber: '',
  companyName: '',
  businessCardTitle: '',
  firmDescription: ''
};

export default function Header({ 
  showBackButton = false, 
  backUrl = "/", 
  backText = "Back" 
}: HeaderProps) {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showInsightsDropdown, setShowInsightsDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [demoForm, setDemoForm] = useState<DemoFormData>(initialDemoForm);

  const tryMailto = () => {
    window.location.href = 'mailto:siddpurdue@gmail.com';
  };

  const openLinkedIn = () => {
    window.open('https://www.linkedin.com/in/-siddharth/', '_blank');
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('siddpurdue@gmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = 'siddpurdue@gmail.com';
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demo request:', demoForm);
    alert('Demo request submitted!');
    setShowDemoModal(false);
    setDemoForm(initialDemoForm);
  };

  const handleInputChange = (field: keyof DemoFormData, value: string) => {
    setDemoForm(prev => ({ ...prev, [field]: value }));
  };

  const openDocument = (filename: string) => {
    window.open(`/assets/${filename}`, '_blank');
    setShowInsightsDropdown(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link
                  href={backUrl}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <FaChevronLeft />
                  <span>{backText}</span>
                </Link>
              )}
              
              {/* Logo and Financial Insights - Top Left */}
              <div className="flex items-center space-x-3">
                <Image
                  src="/assets/logo.png"
                  alt="Financial Insights Logo"
                  width={32}
                  height={32}
                  className="transition-opacity duration-500"
                />
                <div className="relative">
                  <button
                    onClick={() => setShowInsightsDropdown(!showInsightsDropdown)}
                    className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <span className="text-lg font-semibold text-white hover:text-gray-300 transition-colors">Financial Insights</span>
                    <FaChevronDown className={`text-sm transition-transform ${showInsightsDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showInsightsDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50">
                      <div className="p-4">
                        <div className="mb-4">
                          <h4 className="text-white font-semibold mb-2 text-lg">BLOG</h4>
                          <p className="text-gray-400 text-sm mb-3">General information and market insights</p>
                          <button
                            onClick={() => openDocument('blog.html')}
                            className="w-full text-left bg-gray-800 hover:bg-gray-700 text-white p-3 rounded transition-colors"
                          >
                            <div className="font-medium">Topic 1 - Stagflation</div>
                            <div className="text-sm text-gray-400">Tariff-Induced Economic Implications</div>
                          </button>
                        </div>
                        
                        <div className="border-t border-gray-600 pt-4">
                          <h4 className="text-white font-semibold mb-2 text-lg">REPORTS</h4>
                          <p className="text-gray-400 text-sm mb-3">Detailed analysis with numbers and data</p>
                          <button
                            onClick={() => openDocument('report.html')}
                            className="w-full text-left bg-gray-800 hover:bg-gray-700 text-white p-3 rounded transition-colors"
                          >
                            <div className="font-medium">NVIDIA Corporation (NASDAQ: NVDA)</div>
                            <div className="text-sm text-gray-400">Comprehensive Equity Research Report – May 29, 2025</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
              
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FaHeadphones className="text-lg" />
                <span className="text-lg font-semibold text-white hover:text-gray-300 transition-colors">Help</span>
              </button>
              
              <button
                onClick={() => setShowDemoModal(true)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <FaPlay className="text-lg" />
                <span className="text-lg font-semibold text-white hover:text-gray-300 transition-colors">Request a demo</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Click outside to close dropdown */}
      {showInsightsDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowInsightsDropdown(false)}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            
            <h3 className="text-white font-semibold text-lg mb-4">Help</h3>
            
            <div className="space-y-4">
              <button
                onClick={tryMailto}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              >
                Open Email App
              </button>
              
              <div>
                <label className="block text-gray-400 text-xs mb-1">Email to:</label>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-800 text-green-400 px-2 py-1 rounded text-sm flex-1">
                    siddpurdue@gmail.com
                  </code>
                  <button
                    onClick={copyEmail}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    {copied ? '✓' : <FaCopy />}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <button
                  onClick={openLinkedIn}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2"
                >
                  <FaLinkedin />
                  <span>Connect on LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Request Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-8 max-w-md w-full mx-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            
            <h2 className="text-white font-semibold text-lg">Request A Demo</h2>
            <p className="text-gray-400 text-sm mb-6">
              Reach out to learn more about one of the 300+ data sets and solutions 
              available in our marketplace.
            </p>
            
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={demoForm.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="First Name*"
              />
              
              <input
                type="text"
                required
                value={demoForm.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Last Name*"
              />
              
              <input
                type="email"
                required
                value={demoForm.businessEmail}
                onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Business Email*"
              />
              
              <input
                type="tel"
                required
                value={demoForm.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Phone Number (exclude country code)*"
              />
              
              <input
                type="text"
                required
                value={demoForm.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Company Name*"
              />
              
              <input
                type="text"
                required
                value={demoForm.businessCardTitle}
                onChange={(e) => handleInputChange('businessCardTitle', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="Business Card Title*"
              />
              
              <textarea
                required
                value={demoForm.firmDescription}
                onChange={(e) => handleInputChange('firmDescription', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 h-24 resize-none"
                placeholder="Firm Description*"
              />
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
