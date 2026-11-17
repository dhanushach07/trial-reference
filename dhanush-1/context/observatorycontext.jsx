'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { systemData as initialSystemData } from '@/data/mockData';

const ObservatoryContext = createContext(null);

export function ObservatoryProvider({ children }) {
  const [data, setData] = useState(initialSystemData);
  const [activeView, setActiveView] = useState('orbit'); // 'orbit', 'receiver', 'converter'
  const [selectedNode, setSelectedNode] = useState(null);
  const [visibleLayers, setVisibleLayers] = useState([1, 2, 3, 4]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toggle simulation running state
  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  // Select a node (app, permission, connection, or protection) for the inspector
  const selectNode = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  // Close inspector
  const clearSelectedNode = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Toggle a layer visibility
  const toggleLayer = useCallback((layerId) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]
    );
  }, []);

  // Simulate updating a process risk or status (demonstrates dynamic state change in viva)
  const updateAppRisk = useCallback((appId, newRisk) => {
    setData((prev) => ({
      ...prev,
      apps: prev.apps.map((app) =>
        app.id === appId ? { ...app, riskLevel: newRisk } : app
      ),
    }));
    setSelectedNode((prev) =>
      prev && prev.id === appId ? { ...prev, riskLevel: newRisk } : prev
    );
  }, []);

  // Computed flat nodes list for the orbit canvas
  const orbitNodes = useMemo(() => {
    const list = [];
    if (visibleLayers.includes(1)) {
      list.push(...data.apps.map((a) => ({ ...a, nodeType: 'app' })));
    }
    if (visibleLayers.includes(2)) {
      list.push(...data.permissions.map((p) => ({ ...p, nodeType: 'permission' })));
    }
    if (visibleLayers.includes(3)) {
      list.push(...data.connections.map((c) => ({ ...c, nodeType: 'connection' })));
    }
    if (visibleLayers.includes(4)) {
      list.push(...data.protection.map((pr) => ({ ...pr, nodeType: 'protection' })));
    }
    return list;
  }, [data, visibleLayers]);

  const value = {
    system: data.system,
    apps: data.apps,
    permissions: data.permissions,
    connections: data.connections,
    protection: data.protection,
    orbitNodes,
    activeView,
    setActiveView,
    selectedNode,
    selectNode,
    clearSelectedNode,
    visibleLayers,
    toggleLayer,
    isSimulating,
    toggleSimulation,
    filterQuery,
    setFilterQuery,
    updateAppRisk,
    isSettingsOpen,
    setIsSettingsOpen,
  };

  return (
    <ObservatoryContext.Provider value={value}>
      {children}
    </ObservatoryContext.Provider>
  );
}

export function useObservatory() {
  const context = useContext(ObservatoryContext);
  if (!context) {
    throw new Error('useObservatory must be used within an ObservatoryProvider');
  }
  return context;
}

