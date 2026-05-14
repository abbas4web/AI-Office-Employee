import { useEffect, useState } from "react";
import { API_URL, authHeader } from "../api";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import Drawer from "../components/Drawer";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Email Notification Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("plantiqx@gmail.com");
  const [completedTaskId, setCompletedTaskId] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');

  const emptyForm = {
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    due_date: "",
    assigned_to: "",
    client_id: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchClients();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch {
      console.error("Failed to fetch users");
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/api/clients`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setClients(data.data);
    } catch {
      console.error("Failed to fetch clients");
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/tasks`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      } else {
        setError('Failed to load tasks.');
      }
    } catch {
      setError('Cannot reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    const method = editingTask ? "PATCH" : "POST";
    const url = editingTask
      ? `${API_URL}/api/tasks/${editingTask.id}`
      : `${API_URL}/api/tasks`;

    const dataToSend = {
      ...formData,
      assigned_to: formData.assigned_to || null,
      client_id: formData.client_id || null,
      due_date: formData.due_date || null,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(dataToSend),
      });
      const data = await res.json();
      if (res.ok) {
        fetchTasks();
        closeModal();
      } else {
        setFormError(data.message || 'Failed to save task.');
      }
    } catch {
      setFormError('Cannot reach server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Fix 3: populate all fields including assigned_to and client_id
  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      assigned_to: task.assigned_to || "",
      client_id: task.client_id || "",
    });
    setFormError(''); setShowDrawer(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (res.ok) {
        fetchTasks();
      } else {
        setError('Failed to delete task.');
      }
    } catch {
      setError('Cannot reach server.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();

      // If task is marked as completed, open the email popup instead of prompt
      if (newStatus === 'completed') {
        setCompletedTaskId(id);
        setEmailRecipient("plantiqx@gmail.com");
        setEmailSuccessMsg('');
        setEmailErrorMsg('');
        setEmailModalOpen(true);
      }
    } catch {
      setError('Failed to update status.');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailRecipient) {
      setEmailModalOpen(false);
      return;
    }
    setSendingEmail(true);
    setEmailSuccessMsg('');
    setEmailErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/api/email/task-completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ task_id: completedTaskId, recipient_email: emailRecipient }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSuccessMsg(`Email sent successfully to ${emailRecipient}`);
        setTimeout(() => setEmailModalOpen(false), 2000); // Auto close after 2s on success
      } else {
        setEmailErrorMsg(data.message || 'Failed to send email.');
      }
    } catch {
      setEmailErrorMsg('Cannot reach server.');
    } finally {
      setSendingEmail(false);
    }
  };

  const openAdd = () => { setEditingTask(null); setFormData(emptyForm); setFormError(''); setShowDrawer(true); };

  const closeDrawer = () => { setShowDrawer(false); setEditingTask(null); setFormData(emptyForm); setFormError(''); };

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
          <button className="btn btn-secondary" onClick={fetchTasks} disabled={loading}>
            <RefreshCw size={15} />{loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} />Add Task
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <p className="no-data">No tasks found</p>
      ) : (
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Client</th>
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
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{task.assigned_user_name || "-"}</td>
                <td>{task.client_name || "-"}</td>
                <td>
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
                </td>
                <td>
                  <button className="btn btn-small" onClick={() => handleEdit(task)}><Pencil size={13} />Edit</button>
                  <button className="btn btn-small btn-danger" onClick={() => handleDelete(task.id)}><Trash2 size={13} />Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Drawer
        open={showDrawer}
        onClose={closeDrawer}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        subtitle={editingTask ? 'Update task details and assignment.' : 'Create a new task and assign it to a team member.'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeDrawer} disabled={saving}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <div className="error-banner" style={{marginBottom:'1rem'}}>{formError}</div>}

          <div className="drawer-section">
            <p className="drawer-section-title">Task Details</p>
            <div className="form-group">
              <label>Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Task title" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the task..." rows={3} />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Priority</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="drawer-section">
            <p className="drawer-section-title">Assignment</p>
            <div className="form-group">
              <label>Assigned To</label>
              <select value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}>
                <option value="">-- Unassigned --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Client</label>
              <select value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                <option value="">-- No Client (Internal) --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
            </div>
          </div>
        </form>
      </Drawer>

      {/* Email Notification Popup */}
      {emailModalOpen && (
        <div className="modal-overlay" onClick={() => !sendingEmail && setEmailModalOpen(false)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📧 Send Notification</h2>
              <button className="modal-close" onClick={() => setEmailModalOpen(false)} disabled={sendingEmail}>✕</button>
            </div>
            
            <form onSubmit={handleSendEmail} className="modal-form">
              <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.5' }}>
                Task marked as completed! Enter an email address to notify the client or manager. Leave blank to skip.
              </p>

              {emailSuccessMsg && <div className="gmail-toast" style={{ position:'static', transform:'none', marginBottom:'1rem', background:'#10b981' }}>✅ {emailSuccessMsg}</div>}
              {emailErrorMsg && <div className="error-banner" style={{ marginBottom:'1rem' }}>❌ {emailErrorMsg}</div>}

              <div className="form-group">
                <label>Recipient Email</label>
                <input 
                  type="email" 
                  value={emailRecipient} 
                  onChange={e => setEmailRecipient(e.target.value)} 
                  placeholder="name@example.com"
                  disabled={sendingEmail || !!emailSuccessMsg}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEmailModalOpen(false)} disabled={sendingEmail}>
                  {emailRecipient ? 'Cancel' : 'Skip'}
                </button>
                {emailRecipient && (
                  <button type="submit" className="btn btn-primary" disabled={sendingEmail || !!emailSuccessMsg}>
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
