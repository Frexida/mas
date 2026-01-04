import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
}

interface UnitData {
  name: string;
  agents: Agent[];
}

interface UnitStructure {
  [key: string]: UnitData;
}

interface TreeViewProps {
  units: UnitStructure;
  selectedAgent: string | null;
  onSelectAgent: (agentId: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ units, selectedAgent, onSelectAgent }) => {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const toggleUnit = (unitKey: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitKey)) {
      newExpanded.delete(unitKey);
    } else {
      newExpanded.add(unitKey);
    }
    setExpandedUnits(newExpanded);
  };

  return (
    <div className="p-4">
      {Object.entries(units).map(([unitKey, unitData]) => {
        const isExpanded = expandedUnits.has(unitKey);

        return (
          <div key={unitKey} className="mb-2">
            {/* Unit Header */}
            <div
              className="cursor-pointer py-2 hover:bg-mas-bg-subtle select-none text-mas-text rounded transition-colors"
              onClick={() => toggleUnit(unitKey)}
            >
              <span className="mr-2 text-mas-text-muted">{isExpanded ? '▼' : '▶'}</span>
              <span className="font-medium">{unitData.name}</span>
            </div>

            {/* Agents List */}
            {isExpanded && (
              <div className="ml-6">
                {unitData.agents.map(agent => (
                  <div
                    key={agent.id}
                    className={`
                      py-2 px-2 cursor-pointer rounded transition-colors
                      ${selectedAgent === agent.id
                        ? 'bg-mas-blue-muted text-mas-blue'
                        : 'text-mas-text-secondary hover:bg-mas-bg-subtle hover:text-mas-text'}
                    `}
                    onClick={() => onSelectAgent(agent.id)}
                  >
                    <span className="text-mas-text-muted">{agent.id}:</span> {agent.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TreeView;