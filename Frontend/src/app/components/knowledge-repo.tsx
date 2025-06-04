import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Brain, 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  Filter, 
  Plus, 
  Star, 
  MessageCircle, 
  Eye,
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Target,
  Lightbulb,
  Archive,
  Tag,
  Calendar,
  User,
  Bell,
  Settings,
  Activity
} from 'lucide-react';

const KnowledgeRepository = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [notifications, setNotifications] = useState(3);

  // Mock data
  const researchMemories = [
    {
      id: 1,
      title: 'Tesla Q3 2024 Analysis',
      type: 'Company Research',
      lastUpdated: '2 hours ago',
      confidence: 92,
      tags: ['TSLA', 'EV', 'Growth'],
      insights: 15,
      collaborators: ['Sarah Chen', 'Mike Rodriguez']
    },
    {
      id: 2,
      title: 'Fed Rate Decision Impact',
      type: 'Macro Analysis',
      lastUpdated: '1 day ago',
      confidence: 88,
      tags: ['Fed', 'Rates', 'Fixed Income'],
      insights: 23,
      collaborators: ['David Kim', 'Lisa Wang']
    },
    {
      id: 3,
      title: 'Renewable Energy Sector Thesis',
      type: 'Sector Analysis',
      lastUpdated: '3 days ago',
      confidence: 95,
      tags: ['Clean Energy', 'ESG', 'Long-term'],
      insights: 31,
      collaborators: ['Emma Johnson', 'Alex Turner']
    }
  ];

  const investmentTheses = [
    {
      id: 1,
      name: 'AI Infrastructure Play',
      status: 'Active',
      conviction: 'High',
      allocation: '$2.5M',
      performance: '+18.2%',
      lastReview: '1 week ago',
      keyStocks: ['NVDA', 'AMD', 'AVGO']
    },
    {
      id: 2,
      name: 'Value Recovery Bet',
      status: 'Under Review',
      conviction: 'Medium',
      allocation: '$1.8M',
      performance: '+5.7%',
      lastReview: '3 days ago',
      keyStocks: ['JPM', 'BAC', 'WFC']
    }
  ];

  const auditTrail = [
    {
      id: 1,
      action: 'Investment Decision',
      details: 'Increased NVDA position by 2%',
      analyst: 'Sarah Chen',
      timestamp: '2024-05-30 14:30',
      rationale: 'Strong Q1 earnings and AI demand outlook',
      impact: 'High'
    },
    {
      id: 2,
      action: 'Research Update',
      details: 'Updated Tesla price target to $200',
      analyst: 'Mike Rodriguez',
      timestamp: '2024-05-30 11:15',
      rationale: 'Revised production estimates post earnings call',
      impact: 'Medium'
    }
  ];

  const Sidebar = () => (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col pt-16">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">InvestIQ</h1>
        <p className="text-sm text-slate-400 mt-1">Knowledge Repository</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'memory', label: 'Research Memory', icon: Brain },
          { id: 'collaboration', label: 'Collaboration', icon: Users },
          { id: 'retrieval', label: 'Smart Search', icon: Search },
          { id: 'thesis', label: 'Investment Thesis', icon: Target },
          { id: 'audit', label: 'Decision Audit', icon: FileText }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
          <div>
            <p className="text-sm font-medium">John Analyst</p>
            <p className="text-xs text-slate-400">Senior Analyst</p>
          </div>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <div className="bg-white border-b border-slate-200 p-4 fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between ml-64">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'memory' && 'Persistent Research Memory'}
            {activeTab === 'collaboration' && 'Collaborative Intelligence'}
            {activeTab === 'retrieval' && 'Smart Retrieval System'}
            {activeTab === 'thesis' && 'Investment Thesis Tracking'}
            {activeTab === 'audit' && 'Decision Audit Trail'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search across all knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="relative">
            <Bell className="text-slate-600 hover:text-blue-600 cursor-pointer" size={24} />
            {notifications > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </div>
          
          <Settings className="text-slate-600 hover:text-blue-600 cursor-pointer" size={24} />
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Research Items</p>
                <p className="text-3xl font-bold">2,847</p>
              </div>
              <Brain className="text-blue-200" size={32} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Collaborations</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <Users className="text-green-200" size={32} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Investment Theses</p>
                <p className="text-3xl font-bold">8</p>
              </div>
              <Target className="text-purple-200" size={32} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2 text-blue-600" size={20} />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {auditTrail.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{item.action}</p>
                  <p className="text-sm text-slate-600">{item.details}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                    <span>{item.analyst}</span>
                    <span>{item.timestamp}</span>
                    <span className={`px-2 py-1 rounded ${
                      item.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.impact} Impact
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="mr-2 text-yellow-600" size={20} />
            AI Insights
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">High correlation detected between your Tesla research and recent EV sector moves</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">3 team members researching similar Fed policy impacts - suggest collaboration</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">Your AI Infrastructure thesis aligns with 5 recent market developments</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-2 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <Plus className="text-blue-600" size={16} />
              <span>New Research Note</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <Users className="text-green-600" size={16} />
              <span>Start Collaboration</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-3 text-left hover:bg-slate-50 rounded-lg transition-colors">
              <Target className="text-purple-600" size={16} />
              <span>Create Investment Thesis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ResearchMemory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter className="text-slate-600" size={20} />
          <div className="flex space-x-2">
            {['All', 'Company Research', 'Macro Analysis', 'Sector Analysis'].map(filter => (
              <button
                key={filter}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedFilters.includes(filter)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                onClick={() => {
                  if (selectedFilters.includes(filter)) {
                    setSelectedFilters(selectedFilters.filter(f => f !== filter));
                  } else {
                    setSelectedFilters([...selectedFilters, filter]);
                  }
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} />
          <span>New Research</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {researchMemories.map(memory => (
          <div key={memory.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{memory.title}</h3>
                <p className="text-sm text-slate-600">{memory.type}</p>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="text-yellow-500" size={16} />
                <span className="text-sm font-medium">{memory.confidence}%</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {memory.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
              <div className="flex items-center space-x-2">
                <Lightbulb size={16} />
                <span>{memory.insights} insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>{memory.lastUpdated}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {memory.collaborators.slice(0, 3).map((collaborator, idx) => (
                  <div key={idx} className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {collaborator.split(' ').map(n => n[0]).join('')}
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-slate-600 hover:text-blue-600">
                  <Eye size={16} />
                </button>
                <button className="p-2 text-slate-600 hover:text-blue-600">
                  <Share2 size={16} />
                </button>
                <button className="p-2 text-slate-600 hover:text-blue-600">
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'memory': return <ResearchMemory />;
      case 'collaboration': 
        return (
          <div className="text-center py-12">
            <Users className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Collaboration Module</h3>
            <p className="text-slate-500">Coming soon - Team collaboration features</p>
          </div>
        );
      case 'retrieval':
        return (
          <div className="text-center py-12">
            <Search className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Smart Search</h3>
            <p className="text-slate-500">Coming soon - AI-powered knowledge retrieval</p>
          </div>
        );
      case 'thesis':
        return (
          <div className="text-center py-12">
            <Target className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Investment Thesis Tracking</h3>
            <p className="text-slate-500">Coming soon - Thesis management and tracking</p>
          </div>
        );
      case 'audit':
        return (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Decision Audit Trail</h3>
            <p className="text-slate-500">Coming soon - Complete audit trail system</p>
          </div>
        );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Sidebar />
      <div className="ml-64 pt-[72px] p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default KnowledgeRepository;