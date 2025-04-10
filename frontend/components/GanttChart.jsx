import React, { useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import "./GanttChart.css";

/**
 * GanttChart component that displays a gantt chart for task assignments
 * @param {Object} props - The component props
 * @param {Array} props.taskAssignments - Task assignments data
 * @param {Function} props.onDateChange - Callback for when a task date changes
 * @param {Function} props.onTaskClick - Callback for when a task is clicked
 * @param {Function} props.onDblClick - Callback for when a task is double-clicked
 */
const GanttChart = ({ taskAssignments, onDateChange, onTaskClick, onDblClick }) => {
  const [view, setView] = useState(ViewMode.Month);
  const [tasks, setTasks] = useState([]);

  // Process task assignments into the format expected by gantt-task-react
  React.useEffect(() => {
    if (!taskAssignments || taskAssignments.length === 0) return;

    const processedTasks = [];
    const taskMap = {};
    const developerColors = {};
    const colors = [
      '#4F46E5', // Indigo
      '#EC4899', // Pink
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#3B82F6', // Blue
      '#8B5CF6', // Violet
      '#6366F1', // Indigo
      '#A855F7', // Purple
      '#14B8A6'  // Teal
    ];

    // Get unique developers and assign colors
    const developers = [...new Set(taskAssignments.map(a => a.developerName))];
    developers.forEach((developer, index) => {
      developerColors[developer] = colors[index % colors.length];
    });

    // First pass: create a map of task groups
    taskAssignments.forEach(assignment => {
      const taskKey = assignment.taskId;
      if (!taskMap[taskKey]) {
        taskMap[taskKey] = {
          id: assignment.taskId,
          title: assignment.taskTitle,
          isSubtask: assignment.isSubtask,
          parentId: assignment.parentId,
          assignments: []
        };
      }
      taskMap[taskKey].assignments.push(assignment);
    });

    // Second pass: create tasks in the format expected by gantt-task-react
    Object.values(taskMap).forEach(task => {
      task.assignments.forEach(assignment => {
        const startDate = new Date(assignment.startDate);
        const endDate = new Date(assignment.endDate);

        const ganttTask = {
          id: `${task.id}-${assignment.developerName}`,
          name: task.title,
          start: startDate,
          end: endDate,
          progress: 0, // This could be updated if you have progress data
          type: 'task',
          project: task.isSubtask ? task.parentId : undefined,
          styles: {
            progressColor: developerColors[assignment.developerName],
            progressSelectedColor: developerColors[assignment.developerName],
            backgroundColor: developerColors[assignment.developerName],
            backgroundSelectedColor: developerColors[assignment.developerName]
          },
          dependencies: task.isSubtask ? [task.parentId] : undefined,
          hideChildren: false,
          developer: assignment.developerName,
          estimatedHours: assignment.estimatedHours
        };

        processedTasks.push(ganttTask);
      });
    });

    setTasks(processedTasks);
  }, [taskAssignments]);

  // Handle task date changes
  const handleTaskChange = (task) => {
    if (onDateChange) {
      onDateChange(task);
    }
  };

  // Create legend for developers
  const renderLegend = () => {
    if (!taskAssignments || taskAssignments.length === 0) return null;

    const developers = [...new Set(taskAssignments.map(a => a.developerName))];
    const colors = [
      '#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#EF4444',
      '#3B82F6', '#8B5CF6', '#6366F1', '#A855F7', '#14B8A6'
    ];

    return (
      <div className="chart-legend" id="chart-legend">
        {developers.map((developer, index) => (
          <div key={developer} className="chart-legend-item" data-developer={developer}>
            <div 
              className="chart-legend-color" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className="chart-legend-text">{developer}</span>
          </div>
        ))}
      </div>
    );
  };

  // Handle view mode changes
  const handleViewChange = (viewMode) => {
    setView(viewMode);
  };

  // Create view mode controls
  const renderControls = () => {
    return (
      <div className="gantt-chart-controls">
        <button 
          className={`filter-button ${view === ViewMode.Day ? 'active' : ''}`}
          onClick={() => handleViewChange(ViewMode.Day)}
        >
          Day
        </button>
        <button 
          className={`filter-button ${view === ViewMode.Week ? 'active' : ''}`}
          onClick={() => handleViewChange(ViewMode.Week)}
        >
          Week
        </button>
        <button 
          className={`filter-button ${view === ViewMode.Month ? 'active' : ''}`}
          onClick={() => handleViewChange(ViewMode.Month)}
        >
          Month
        </button>
      </div>
    );
  };

  // If no tasks, return empty div
  if (!tasks || tasks.length === 0) {
    return <div className="gantt-chart-wrapper">No tasks to display</div>;
  }

  // Custom tooltip content
  const TooltipContent = ({ task, fontSize, fontFamily }) => {
    return (
      <div style={{ 
        background: '#272e4d', 
        padding: '10px',
        borderRadius: '8px',
        color: 'white',
        fontSize: fontSize || '14px',
        fontFamily: fontFamily || 'Arial',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h5 style={{ margin: '0 0 8px', fontSize: '16px' }}>{task.name}</h5>
        <p style={{ margin: '0 0 5px' }}>Developer: {task.developer}</p>
        <p style={{ margin: '0 0 5px' }}>
          Duration: {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}
        </p>
        <p style={{ margin: '0' }}>
          Estimated Hours: {task.estimatedHours}
        </p>
      </div>
    );
  };

  return (
    <div className="gantt-chart-container">
      <div className="gantt-chart-header">
        <h3 className="gantt-chart-title">Work Allocation Plan</h3>
        <div className="gantt-chart-actions">
          <button 
            id="talk-to-gantt" 
            className="btn btn-small" 
            title="Modify Gantt Chart with Voice"
            onClick={() => {
              if (window.startGanttChartModificationRecording) {
                window.startGanttChartModificationRecording();
              }
            }}
          >
            <i className="material-icons">mic</i> Talk to Chart
          </button>
          <button 
            id="export-gantt-json" 
            className="btn btn-small" 
            title="Export Gantt Chart"
            onClick={() => {
              if (window.exportGanttChartJson) {
                window.exportGanttChartJson();
              }
            }}
          >
            <i className="material-icons">file_download</i> Export
          </button>
          <button 
            id="import-gantt-json" 
            className="btn btn-small" 
            title="Import Gantt Chart"
            onClick={() => {
              if (window.importGanttChartJson) {
                window.importGanttChartJson();
              }
            }}
          >
            <i className="material-icons">file_upload</i> Import
          </button>
        </div>
      </div>
      
      {renderControls()}
      
      <div className="gantt-chart-wrapper">
        <Gantt
          tasks={tasks}
          viewMode={view}
          onDateChange={handleTaskChange}
          onClick={onTaskClick}
          onDoubleClick={onDblClick}
          listCellWidth=""
          columnWidth={60}
          barCornerRadius={5}
          barFill={80}
          handleWidth={8}
          TooltipContent={TooltipContent}
        />
      </div>
      
      {renderLegend()}
    </div>
  );
};

export default GanttChart; 