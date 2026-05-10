import { useEffect, useState } from "react";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    due_date: "",
    assigned_to: "",
    client_id: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchClients();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        "https://ai-office-employee-api.vercel.app/api/users"
      );
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(
        "https://ai-office-employee-api.vercel.app/api/clients"
      );
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(
        "https://ai-office-employee-api.vercel.app/api/tasks"
      );
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingTask ? "PATCH" : "POST";
    const url = editingTask
      ? `https://ai-office-employee-api.vercel.app/api/tasks/${editingTask.id}`
      : "https://ai-office-employee-api.vercel.app/api/tasks";

    // Convert empty strings to null for UUID fields
    const dataToSend = {
      ...formData,
      assigned_to: formData.assigned_to || null,
      client_id: formData.client_id || null,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (res.ok) {
        fetchTasks();
        setShowModal(false);
        setEditingTask(null);
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          status: "pending",
          due_date: "",
          assigned_to: "",
          client_id: "",
        });
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await fetch(
          `https://ai-office-employee-api.vercel.app/api/tasks/${id}`,
          {
            method: "DELETE",
          }
        );
        fetchTasks();
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`https://ai-office-employee-api.vercel.app/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filteredTasks =
    priorityFilter === "all"
      ? tasks
      : tasks.filter((task) => task.priority === priorityFilter);

  const getPriorityColor = (priority) => {
    const colors = {
      low: "#4caf50",
      medium: "#ff9800",
      high: "#f44336",
      urgent: "#9c27b0",
    };
    return colors[priority] || "#666";
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1>Tasks</h1>
        <div className="header-actions">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchTasks}>
            Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            Add Task
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <p className="no-data">No tasks found</p>
      ) : (
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.description || "-"}</td>
                <td>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                </td>
                <td>
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value)
                    }
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  {task.due_date
                    ? new Date(task.due_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <button
                    className="btn btn-small"
                    onClick={() => handleEdit(task)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingTask ? "Edit Task" : "Add New Task"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) =>
                    setFormData({ ...formData, assigned_to: e.target.value })
                  }
                >
                  <option value="">-- Unassigned --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Client</label>
                <select
                  value={formData.client_id}
                  onChange={(e) =>
                    setFormData({ ...formData, client_id: e.target.value })
                  }
                >
                  <option value="">-- No Client (Internal) --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                    setFormData({
                      title: "",
                      description: "",
                      priority: "medium",
                      status: "pending",
                      due_date: "",
                      assigned_to: "",
                      client_id: "",
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
