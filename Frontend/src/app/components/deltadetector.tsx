'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, BarChart3, Calendar, Filter, Download, RefreshCw } from 'lucide-react';

const DeltaDetectionUI = () => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [timeRange, setTimeRange] = useState({ from: '2024', to: '2025' });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const companies = [
    'Apple Inc. (AAPL)', 'NVIDIA Corp. (NVDA)', 'Microsoft Corp. (MSFT)', 
    'Meta Platforms (META)', 'Tesla Inc. (TSLA)', 'Amazon.com Inc. (AMZN)',
    'Alphabet Inc. (GOOGL)', 'Berkshire Hathaway (BRK.A)'
  ];

  const metrics = [
    'Risk Management', 'Innovation Index', 'ESG Score', 'Operational Efficiency',
    'Market Position', 'Financial Stability', 'R&D Investment', 'Regulatory Compliance'
  ];

  const mockResults = {
    'Apple Inc. (AAPL)': {
      'Risk Management': {
        score2024: 7.2,
        score2025: 8.4,
        delta: '+16.7%',
        trend: 'up',
        insights: [
          'Improved supply chain diversification reduced geopolitical risk exposure',
          'Enhanced cybersecurity protocols following industry-wide threats',
          'Better currency hedging strategies implemented globally'
        ]
      },
      'Innovation Index': {
        score2024: 8.1,
        score2025: 8.7,
        delta: '+7.4%',
        trend: 'up',
        insights: [
          'Vision Pro launch demonstrated AR/VR leadership',
          'AI integration across product ecosystem accelerated',
          'Increased patent filings in emerging technologies'
        ]
      }
    },
    'NVIDIA Corp. (NVDA)': {
      'Innovation Index': {
        score2024: 9.2,
        score2025: 9.6,
        delta: '+4.3%',
        trend: 'up',
        insights: [
          'Breakthrough in AI chip architecture with next-gen GPUs',
          'Expanded partnerships in autonomous vehicle sector',
          'Advanced quantum computing research initiatives'
        ]
      }
    }
  };

  const handleAnalyze = () => {
    if (!selectedCompany || !selectedMetric) return;
    setIsLoading(true);
    
    setTimeout(() => {
      const companyKey = selectedCompany;
      const result = mockResults[companyKey]?.[selectedMetric];
      setAnalysisResults(result || null);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Delta Detection Analytics
          </h1>
          <p className="text-gray-400 text-lg">
            Compare company performance metrics across time periods to identify key improvements and risks
          </p>
        </div>

        {/* Controls Panel */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Company Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Select Company
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select 
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 text-white"
                >
                  <option value="" className="bg-gray-900 text-white">Choose a company...</option>
                  {companies.map(company => (
                    <option key={company} value={company} className="bg-gray-900 text-white">{company}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metric Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Analysis Metric
              </label>
              <div className="relative">
                <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select 
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 text-white"
                >
                  <option value="" className="bg-gray-900 text-white">Select metric...</option>
                  {metrics.map(metric => (
                    <option key={metric} value={metric} className="bg-gray-900 text-white">{metric}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Time Period
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text"
                    value={timeRange.from}
                    onChange={(e) => setTimeRange({...timeRange, from: e.target.value})}
                    className="w-full pl-10 pr-2 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-center bg-white/10 text-white"
                  />
                </div>
                <span className="text-gray-400 font-medium">vs</span>
                <div className="flex-1">
                  <input 
                    type="text"
                    value={timeRange.to}
                    onChange={(e) => setTimeRange({...timeRange, to: e.target.value})}
                    className="w-full px-2 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-center bg-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <div className="flex items-end">
              <button
                onClick={handleAnalyze}
                disabled={!selectedCompany || !selectedMetric || isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {isLoading ? 'Analyzing...' : 'Analyze Delta'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {analysisResults && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {/* Results Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {selectedCompany} - {selectedMetric}
                  </h2>
                  <p className="text-blue-100">
                    Performance comparison: {timeRange.from} vs {timeRange.to}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Score Comparison */}
            <div className="p-6 border-b border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-300 mb-1">
                    {analysisResults.score2024}
                  </div>
                  <div className="text-sm text-gray-400">{timeRange.from} Score</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {analysisResults.trend === 'up' ? (
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                    <span className={`text-2xl font-bold ${
                      analysisResults.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {analysisResults.delta}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">Change</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {analysisResults.score2025}
                  </div>
                  <div className="text-sm text-gray-400">{timeRange.to} Score</div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Key Performance Drivers
              </h3>
              <div className="space-y-3">
                {analysisResults.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="p-6 bg-white/5 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                Recommended Next Steps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-white/10 border border-white/20 p-4 rounded-lg hover:bg-white/20 transition-all text-left">
                  <div className="font-semibold text-white mb-1">Deep Dive Analysis</div>
                  <div className="text-sm text-gray-400">Get detailed breakdown of contributing factors</div>
                </button>
                <button className="bg-white/10 border border-white/20 p-4 rounded-lg hover:bg-white/20 transition-all text-left">
                  <div className="font-semibold text-white mb-1">Peer Comparison</div>
                  <div className="text-sm text-gray-400">Compare against industry benchmarks</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Example Queries */}
        {!analysisResults && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Example Analysis Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-500/30">
                <div className="font-semibold text-white mb-2">Risk Management</div>
                <div className="text-sm text-gray-400">
                  "How did Apple manage risk better in 2025 than 2024?"
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg border border-green-500/30">
                <div className="font-semibold text-white mb-2">Innovation Analysis</div>
                <div className="text-sm text-gray-400">
                  "How is NVIDIA enhancing innovations in 2025 vs 2024?"
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeltaDetectionUI;