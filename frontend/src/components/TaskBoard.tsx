/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation } from "@apollo/client/react";
import { useParams, Link } from "react-router-dom";
import { gql } from "@apollo/client";
import { PlusCircle, MessageSquare } from "lucide-react";
import { useState } from "react";

interface TaskBoardData {
  project: {
    id: string;
    name: string;
    description: string;
    status: string;
    tasks: {
      id: string;
      title: string;
      status: string;
      assigneeEmail: string;
      comments: { id: string }[];
    }[];
  };
}

const GET_PROJECT_DETAILS = gql`
  query GetProjectDetails($id: ID!) {
    project(id: $id) {
      id
      name
      description
      status
      tasks {
        id
        title
        status
        assigneeEmail
        comments {
          id
          content
          authorEmail
          createdAt
        }
      }
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment($taskId: ID!, $content: String!, $authorEmail: String!) {
    addComment(taskId: $taskId, content: $content, authorEmail: $authorEmail) {
      comment {
        id
        content
        createdAt
      }
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($projectId: ID!, $title: String!, $assignee: String!) {
    createTask(projectId: $projectId, title: $title, assigneeEmail: $assignee) {
      task {
        id
        title
        status
      }
    }
  }
`;

const UPDATE_PROJECT_STATUS = gql`
  mutation UpdateProjectStatus($projectId: ID!, $status: String!) {
    updateProjectStatus(projectId: $projectId, status: $status) {
      project {
        id
        status
      }
    }
  }
`;

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($taskId: ID!, $status: String!) {
    updateTaskStatus(taskId: $taskId, status: $status) {
      task {
        id
        status
      }
    }
  }
`;

export default function TaskBoard() {
  const { projectId } = useParams();
  const { loading, error, data, refetch } = useQuery<TaskBoardData>(
    GET_PROJECT_DETAILS,
    {
      variables: { id: projectId },
    }
  );

  const [createTask] = useMutation(CREATE_TASK, {
    onCompleted: () => refetch(),
  });
  const [addComment] = useMutation(ADD_COMMENT, {
    onCompleted: () => refetch(),
  });
  
  const [updateProjectStatus] = useMutation(UPDATE_PROJECT_STATUS);

  const toggleProjectStatus = (currentStatus: string | undefined) => {
    const newStatus = currentStatus === "ACTIVE" ? "ON_HOLD" : "ACTIVE";
    updateProjectStatus({
      variables: { projectId, status: newStatus },
    });
  };

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [commentText, setCommentText] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;

    addComment({
      variables: {
        taskId: selectedTask.id,
        content: commentText,
        authorEmail: "me@demo.com",
      },
    });
    setCommentText("");
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">Loading Board...</div>
    );
  if (error)
    return <div className="p-10 text-red-500">Error: {error.message}</div>;

  const project = data?.project;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTask({
      variables: { projectId, title: newTaskTitle, assignee: "me@demo.com" },
    });
    setNewTaskTitle("");
    setIsModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-6">

      <div className="flex justify-between items-center mb-8">
        <div>
          <Link
            to="/"
            className="text-gray-400 hover:text-gray-600 text-sm mb-1 block"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => toggleProjectStatus(project?.status)}
            className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
              project?.status === "ACTIVE"
                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
            }`}
            title="Click to toggle status"
          >
            {project?.status === "ACTIVE" ? "● ACTIVE" : "⏸ ON HOLD"}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {project?.description || "No description provided."}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <PlusCircle size={20} /> New Task
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 h-full">
        <Column
          title="To Do"
          status="TODO"
          color="border-gray-300"
          tasks={project?.tasks.filter((t: any) => t.status === "TODO")}
          onTaskClick={setSelectedTask}
        />
        <Column
          title="In Progress"
          status="IN_PROGRESS"
          color="border-blue-400"
          tasks={project?.tasks.filter((t: any) => t.status === "IN_PROGRESS")}
          onTaskClick={setSelectedTask}
        />
        <Column
          title="Completed"
          status="DONE"
          color="border-green-400"
          tasks={project?.tasks.filter((t: any) => t.status === "DONE")}
          onTaskClick={setSelectedTask}
        />
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Comments
              </h3>
              <div className="space-y-3 mb-4">
                {selectedTask.comments.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No comments yet.
                  </p>
                ) : (
                  selectedTask.comments.map((c: any) => (
                    <div
                      key={c.id}
                      className="text-sm border-l-2 border-indigo-200 pl-3"
                    >
                      <span className="font-bold text-gray-700">
                        {c.authorEmail}
                      </span>
                      <p className="text-gray-600">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3 py-2 rounded text-sm font-medium"
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Column({ title, status, tasks, color, onTaskClick }: any) {
  const [updateStatus] = useMutation(UPDATE_TASK_STATUS);
  
  const moveTask = (e: React.MouseEvent, taskId: string, newStatus: string) => {
    e.stopPropagation(); 
    updateStatus({ variables: { taskId, status: newStatus } });
  };

  return (
    <div className="flex-1 min-w-[300px] bg-gray-50 rounded-xl p-4 flex flex-col h-full">
      <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${color}`}>
        <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
          {title}
        </h3>
        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            onClick={() => onTaskClick(task)} 
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{task.title}</h4>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 mt-3">
              <div className="flex items-center gap-1">
                <MessageSquare size={14} /> {task.comments.length}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              
                {status !== "TODO" && (
                  <button
                    onClick={(e) =>
                      moveTask(
                        e,
                        task.id,
                        status === "DONE" ? "IN_PROGRESS" : "TODO"
                      )
                    }
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600"
                    title="Move Back"
                  >
                    ⬅️
                  </button>
                )}

                {status !== "DONE" && (
                  <button
                    onClick={(e) =>
                      moveTask(
                        e,
                        task.id,
                        status === "TODO" ? "IN_PROGRESS" : "DONE"
                      )
                    }
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600"
                    title="Move Forward"
                  >
                    ➡️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}