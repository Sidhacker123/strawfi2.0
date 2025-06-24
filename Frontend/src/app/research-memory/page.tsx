'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  ExternalLink,
  Brain,
  Users,
  ChevronDown,
  GitBranch,
  PlusCircle,
  X,
  Clock,
  User,
  Search,
  Lock
} from 'lucide-react';
import CreateResearchModal from '../components/research/create-research-modal';
import AddVersionModal from '../components/research/AddVersionModel';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/* ---------- types ---------- */

interface ResearchVersion {
  id: string;
  research_id: string;
  content: string;
  created_at: string;
  author: string;
  version_number: number;
  file_url: string | null;
}

interface ResearchItem {
  id: string;
  title: string;
  type: string;
  tags: string[];
  content: string;
  created_at: string;
  updated_at: string;
  file_url: string | null;
  status: string;
  relevance_score: number;
  versions: ResearchVersion[];
  author?: string;
}

/* ---------- mock fallback ---------- */

const mockResearchItems: ResearchItem[] = [
  /* ... same mock data as before ... */
];

/* ---------- helpers ---------- */

function stripHtml(html: string) {
  if (!html) return '';
  // Create a temporary div element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  // Get the text content without HTML tags
  return tempDiv.textContent || tempDiv.innerText || '';
}

// Alternative regex-based HTML stripping for server-side or when DOM is not available
function stripHtmlRegex(html: string) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

/* ---------- component ---------- */

export default function ResearchMemory() {
  const { user, jwt } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  /* version UI state */
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, ResearchVersion[]>>({});
  const [versionModal, setVersionModal] = useState<{
    open: boolean;
    version: ResearchVersion | null;
    researchTitle: string;
  }>({ open: false, version: null, researchTitle: '' });
  const [addVerModal, setAddVerModal] = useState<{
    open: boolean;
    researchId: string;
    title: string;
    type: string;
  }>({ open: false, researchId: '', title: '', type: '' });

  const [activeEditors, setActiveEditors] = useState<Record<string, string[]>>({});
  const [ws, setWs] = useState<WebSocket | null>(null);

  const fetchResearchItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: items, error: itemsError } = await supabase
        .from('research')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Initialize versions state for all items
      const initialVersions: Record<string, ResearchVersion[]> = {};

      const itemsWithVersions = await Promise.all(
        items.map(async (item) => {
          const { data: versions, error: versionsError } = await supabase
            .from('research_versions')
            .select('*')
            .eq('research_id', item.id)
            .order('version_number', { ascending: true });

          if (versionsError) throw versionsError;

          // Add the research item itself as version 0
          const allVersions = [
            {
              id: item.id,
              research_id: item.id,
              content: item.content,
              created_at: item.created_at,
              author: item.author || 'Unknown',
              version_number: 0,
              file_url: item.file_url
            },
            ...(versions || [])
          ];

          // Store versions in the versions state
          initialVersions[item.id] = allVersions;

          return {
            ...item,
            versions: allVersions
          };
        })
      );

      // Update both states at once
      setResearchItems(itemsWithVersions);
      setVersions(initialVersions);
    } catch (err: any) {
      console.error('Error fetching research items:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchItems();
  }, [supabase]);

  const toggleVersions = async (research: ResearchItem) => {
    setOpenDropdown(d => (d === research.id ? null : research.id));

    // If versions are already loaded, no need to fetch again
    if (versions[research.id]) {
      return;
    }

    try {
      const { data: versions, error: versionsError } = await supabase
        .from('research_versions')
        .select('*')
        .eq('research_id', research.id)
        .order('version_number', { ascending: true });

      if (versionsError) throw versionsError;

      // Add the research item itself as version 0
      const allVersions = [
        {
          id: research.id,
          research_id: research.id,
          content: research.content,
          created_at: research.created_at,
          author: research.author || 'Unknown',
          version_number: 0,
          file_url: research.file_url
        },
        ...(versions || [])
      ];

      setVersions(v => ({ ...v, [research.id]: allVersions }));
    } catch (error) {
      console.error('Error fetching versions:', error);
      setError('Failed to load versions');
    }
  };

  const refreshVersions = async (researchId: string) => {
    console.log(`Refreshing versions for research ID: ${researchId}`);
    const { data: versions, error: versionsError } = await supabase
      .from('research_versions')
      .select('*')
      .eq('research_id', researchId)
      .order('version_number', { ascending: true });

    if (versionsError) {
      console.error(`Failed to refresh versions for ${researchId}:`, versionsError);
      return;
    }

    // Get the research item to add as version 0
    const { data: research, error: researchError } = await supabase
      .from('research')
      .select('*')
      .eq('id', researchId)
      .single();

    if (researchError) {
      console.error(`Failed to fetch research for ${researchId}:`, researchError);
      return;
    }

    // Add the research item itself as version 0
    const allVersions = [
      {
        id: research.id,
        research_id: research.id,
        content: research.content,
        created_at: research.created_at,
        author: research.author || 'Unknown',
        version_number: 0,
        file_url: research.file_url
      },
      ...(versions || [])
    ];

    console.log(`Refreshed versions for ${researchId}:`, allVersions);
    setVersions(v => ({ ...v, [researchId]: allVersions }));
  };

  const handleCreateSuccess = () => {
    fetchResearchItems();
    setIsCreateModalOpen(false);
  };

  const filteredResearch = researchItems.filter(item => {
    const cleanContent = stripHtmlRegex(item.content);
    return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cleanContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'editors_update') {
        // Filter out current user from the editors list
        const filteredEditors = {};
        Object.entries(data.editors).forEach(([researchId, editors]) => {
          const otherEditors = (editors as string[]).filter(editor => editor !== user?.email);
          if (otherEditors.length > 0) {
            filteredEditors[researchId] = otherEditors;
          }
        });
        setActiveEditors(filteredEditors);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connectWebSocket, 5000);
    };

    setWs(socket);
    return socket;
  }, [user?.email]);

  useEffect(() => {
    const socket = connectWebSocket();
    return () => {
      socket.close();
    };
  }, [connectWebSocket]);

  // Function to notify server when starting to edit
  const notifyEditing = useCallback((researchId: string) => {
    if (ws?.readyState === WebSocket.OPEN && user?.id) {
      ws.send(JSON.stringify({
        type: 'start_edit',
        researchId,
        username: user.id
      }));
    }
  }, [ws, user]);

  // Function to notify server when stopping edit
  const notifyStoppedEditing = useCallback((researchId: string) => {
    if (ws?.readyState === WebSocket.OPEN && user?.id) {
      ws.send(JSON.stringify({
        type: 'stop_edit',
        researchId,
        username: user.id
      }));
    }
  }, [ws, user]);

  // Update the modal open/close handlers to include editing notifications
  const handleOpenAddVersion = (research: ResearchItem) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setAddVerModal({
      open: true,
      researchId: research.id,
      title: research.title,
      type: research.type
    });
    notifyEditing(research.id);
  };

  const handleCloseAddVersion = () => {
    if (addVerModal.researchId) {
      notifyStoppedEditing(addVerModal.researchId);
    }
    setAddVerModal(p => ({ ...p, open: false }));
  };

  // Update lock/unlock requests to send JWT
  const acquireLock = async (researchId: string) => {
    if (!jwt) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/research/${researchId}/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });
  };
  const releaseLock = async (researchId: string) => {
    if (!jwt) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/research/${researchId}/lock`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* page header */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Research Memory
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Your persistent knowledge repository
          </p>
        </div>

        {/* Search and Create Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search research..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Research
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 max-w-4xl mx-auto">
            {error}
          </div>
        )}

        {/* grid of research cards */}
        {filteredResearch.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No research items found. Create your first research!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredResearch.map((research) => (
              <Card
                key={research.id}
                className="relative hover:shadow-lg transition-all duration-300 bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10"
              >
                {activeEditors[research.id]?.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 z-10 bg-red-600 text-white flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    {activeEditors[research.id].length === 1
                      ? `${activeEditors[research.id][0]} is editing...`
                      : `${activeEditors[research.id].length} people are editing...`}
                  </Badge>
                )}

                {/* clickable header */}
                <CardHeader
                  onClick={() => toggleVersions(research)}
                  className="cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-semibold text-white flex items-center">
                      {research.title}
                      <ChevronDown
                        className={`ml-2 w-5 h-5 transition-transform duration-200 ${
                          openDropdown === research.id ? 'rotate-180' : ''
                        }`}
                      />
                    </CardTitle>
                    <Badge
                      className={`${
                        research.type === 'Company Research'
                          ? 'bg-blue-600 text-white'
                          : research.type === 'Macro Analysis'
                          ? 'bg-green-600 text-white'
                          : research.type === 'Sector Analysis'
                          ? 'bg-purple-600 text-white'
                          : 'bg-orange-600 text-white'
                      }`}
                    >
                      {research.type}
                    </Badge>
                  </div>
                </CardHeader>

                {/* versions dropdown */}
                {openDropdown === research.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                          }}
                          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-300" />
                        </button>
                      </div>
                      
                      {/* Header */}
                      <div className="p-6 pb-4 border-b border-gray-700">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
                          <GitBranch className="w-5 h-5 text-blue-400" />
                          {research.title} - Versions
                        </h3>
                      </div>

                      {/* Scrollable content with controls */}
                      <div className="flex-1 relative">
                        {/* Scroll Up Button */}
                        <button
                          onClick={() => {
                            const scrollContainer = document.getElementById(`versions-scroll-${research.id}`);
                            if (scrollContainer) {
                              scrollContainer.scrollBy({ top: -200, behavior: 'smooth' });
                            }
                          }}
                          className="absolute top-2 right-2 z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors shadow-lg"
                          title="Scroll Up"
                        >
                          <ChevronDown className="w-4 h-4 text-gray-300 rotate-180" />
                        </button>

                        {/* Scroll Down Button */}
                        <button
                          onClick={() => {
                            const scrollContainer = document.getElementById(`versions-scroll-${research.id}`);
                            if (scrollContainer) {
                              scrollContainer.scrollBy({ top: 200, behavior: 'smooth' });
                            }
                          }}
                          className="absolute bottom-2 right-2 z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors shadow-lg"
                          title="Scroll Down"
                        >
                          <ChevronDown className="w-4 h-4 text-gray-300" />
                        </button>

                        <div 
                          id={`versions-scroll-${research.id}`}
                          className="overflow-y-auto h-full p-4 pr-12"
                          style={{ maxHeight: 'calc(80vh - 180px)' }}
                        >
                          <table className="w-full text-sm text-gray-300">
                            <thead className="sticky top-0 bg-gray-900 z-10">
                              <tr className="border-b border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-400">Version</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-400">Author</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-400">Date</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-400">Content</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-400">File</th>
                              </tr>
                            </thead>
                            <tbody>
                              {versions[research.id]?.map(v => (
                                <tr 
                                  key={v.id} 
                                  className="bg-gray-800 hover:bg-gray-700 cursor-pointer text-gray-300 border-b border-gray-700"
                                  onClick={() =>
                                    setVersionModal({
                                      open: true,
                                      version: v,
                                      researchTitle: research.title
                                    })
                                  }
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center">
                                      <GitBranch className="w-4 h-4 mr-2 text-blue-400" />
                                      {v.version_number}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">{v.author}</td>
                                  <td className="py-3 px-4">{new Date(v.created_at).toLocaleDateString()}</td>
                                  <td className="py-3 px-4">
                                    <div className="max-w-[200px] truncate">
                                      {stripHtmlRegex(v.content)}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    {v.file_url && (
                                      <a 
                                        href={v.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <FileText className="w-4 h-4" />
                                      </a>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Fixed Footer with Add Version Button */}
                      <div className="border-t border-gray-700 p-4 bg-gray-900">
                        <button
                          onClick={() => handleOpenAddVersion(research)}
                          className="flex items-center justify-center px-4 py-2 text-blue-400 hover:bg-gray-800 text-sm rounded-md w-full transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add version
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* body */}
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-300 line-clamp-3">
                      {stripHtmlRegex(research.content)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {research.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-white/10 text-white"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {research.file_url && (
                      <a
                        href={research.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View attached file
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(research.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Brain className="w-4 h-4 mr-1" />
                          <span>{research.relevance_score}% confidence</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* create research */}
        <CreateResearchModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* add version */}
        <AddVersionModal
          isOpen={addVerModal.open}
          researchId={addVerModal.researchId}
          title={addVerModal.title}
          type={addVerModal.type}
          onClose={handleCloseAddVersion}
          onSuccess={() => {
            refreshVersions(addVerModal.researchId);
            handleCloseAddVersion();
          }}
        />

        {/* version details */}
        {versionModal.open && versionModal.version && (
          <VersionDetailsModal
            isOpen={versionModal.open}
            onClose={() => setVersionModal({ open: false, version: null, researchTitle: '' })}
            version={versionModal.version}
            researchTitle={versionModal.researchTitle}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- VersionDetailsModal ---------- */

const VersionDetailsModal = ({
  isOpen,
  onClose,
  version,
  researchTitle
}: {
  isOpen: boolean;
  onClose: () => void;
  version: ResearchVersion;
  researchTitle: string;
}) => {
  if (!isOpen || !version) return null;

  // Helper function to strip HTML for modal content
  const stripHtmlRegex = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <GitBranch className="w-5 h-5 text-blue-400" />
                {researchTitle} - Version {version.version_number}
              </h2>
              <p className="text-gray-300 mt-1">
                Created by {version.author} on{' '}
                {new Date(version.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold mb-2 text-white">Content</h3>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-300">
                  {stripHtmlRegex(version.content)}
                </p>
              </div>
            </div>

            {version.file_url && (
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
                <h3 className="font-semibold mb-2 text-white">Attached File</h3>
                <a
                  href={version.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-400 hover:text-blue-300"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View File
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-700 mt-6">
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};