/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery, useMutation } from '@apollo/client/react';
import {gql} from '@apollo/client'
import { Link } from 'react-router-dom';
import { FolderPlus, Layout, CheckSquare } from 'lucide-react';
import { useState } from 'react';
type data ={
    projects : []
}
const GET_PROJECTS = gql`
  query GetProjects($orgSlug: String!) {
    projects(orgSlug: $orgSlug) {
      id
      name
      description
      status
      taskCount
      completedTaskCount
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($orgSlug: String!, $name: String!, $desc: String!) {
    createProject(orgSlug: $orgSlug, name: $name, description: $desc) {
      project { id }
    }
  }
`;

export default function Dashboard() {
  const [orgSlug] = useState('acme'); 
  const { loading, error, data, refetch } = useQuery<data>(GET_PROJECTS, { variables: { orgSlug } });
  const [createProject] = useMutation(CREATE_PROJECT, { onCompleted: () => { refetch(); setIsModalOpen(false); }});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  if (loading) return <div className="p-10">Loading...</div>;
  if (error) return <div className="p-10 text-red-500">Error: {error.message}</div>;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProject({ variables: { orgSlug, name, desc } });
  };

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex justify-between items-end mb-10">
        <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Projects</h1>
            <p className="text-gray-500 mt-2 text-lg">Manage your team's work across {data?.projects.length} active projects.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-xl"
        >
            <FolderPlus size={20} /> New Project
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.projects.map((project: any) => (
          <Link to={`/project/${project.id}`} key={project.id} className="group block">
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Layout size={24} />
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {project.status}
                    </span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{project.name}</h2>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-1">{project.description || "No description."}</p>
                
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <CheckSquare size={16} />
                        <span>{project.completedTaskCount}/{project.taskCount} Done</span>
                    </div>
                    <span>View Board →</span>
                </div>
            </div>
          </Link>
        ))}
      </div>

       {/* Project Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm z-50">
            <form onSubmit={handleCreate} className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Project</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                        <input className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-lg transition-all">Create Project</button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
}