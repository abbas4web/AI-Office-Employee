import React from 'react';
import { Search } from 'lucide-react';

export default function FilterBar({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter, 
  priorityFilter, 
  setPriorityFilter, 
  sortBy, 
  setSortBy 
}) {
  return (
    <div className="filter-bar">
      <div className="filter-input-wrapper">
        <Search className="filter-search-icon" size={16} />
        <input
          type="text"
          placeholder="Search tasks by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Priority</label>
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
        </div>

        <div className="filter-group">
          <label className="filter-label">Sort By</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            className="filter-select"
          >
            <option value="dueDateAsc">Due Date (Earliest)</option>
            <option value="dueDateDesc">Due Date (Latest)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
