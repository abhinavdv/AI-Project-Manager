import React from 'react';
import ReactDOM from 'react-dom';
import GanttChart from './GanttChart';

/**
 * Renders the GanttChart component into the specified DOM element
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.taskAssignments - Task assignments data
 * @param {HTMLElement} options.container - DOM element to render into
 * @param {Function} options.onDateChange - Callback for when a task date changes
 * @param {Function} options.onTaskClick - Callback for when a task is clicked
 * @param {Function} options.onDblClick - Callback for when a task is double-clicked
 */
export function renderGanttChart(options) {
  const { 
    taskAssignments, 
    container, 
    onDateChange,
    onTaskClick,
    onDblClick 
  } = options;

  if (!container) {
    console.error('No container provided for Gantt chart');
    return;
  }

  ReactDOM.render(
    <GanttChart 
      taskAssignments={taskAssignments}
      onDateChange={onDateChange}
      onTaskClick={onTaskClick}
      onDblClick={onDblClick}
    />,
    container
  );
}

/**
 * Unmounts the GanttChart component from the specified DOM element
 * 
 * @param {HTMLElement} container - DOM element to unmount from
 */
export function unmountGanttChart(container) {
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
  }
} 