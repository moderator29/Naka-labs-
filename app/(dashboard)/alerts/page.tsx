'use client';

import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';

interface Alert {
  id: string;
  name: string;
  type: 'PRICE' | 'VOLUME' | 'WHALE' | 'NEW_POOL';
  tokenSymbol?: string;
  condition: string;
  target?: number;
  active: boolean;
  notifyInApp: boolean;
  notifyEmail: boolean;
  lastTriggered?: string;
}

export default function AlertsPage() {
  const account = useActiveAccount();
  const authenticated = !!account;
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      name: 'ETH Price Alert',
      type: 'PRICE',
      tokenSymbol: 'ETH',
      condition: 'above',
      target: 4000,
      active: true,
      notifyInApp: true,
      notifyEmail: false,
    },
    {
      id: '2',
      name: 'Whale Movement',
      type: 'WHALE',
      condition: 'any',
      active: true,
      notifyInApp: true,
      notifyEmail: false,
    },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    type: 'PRICE' as Alert['type'],
    tokenSymbol: '',
    condition: 'above',
    target: '',
    notifyInApp: true,
    notifyEmail: false,
  });

  function createAlert() {
    if (!newAlert.name) return;
    const alert: Alert = {
      id: Date.now().toString(),
      name: newAlert.name,
      type: newAlert.type,
      tokenSymbol: newAlert.tokenSymbol || undefined,
      condition: newAlert.condition,
      target: newAlert.target ? parseFloat(newAlert.target) : undefined,
      active: true,
      notifyInApp: newAlert.notifyInApp,
      notifyEmail: newAlert.notifyEmail,
    };
    setAlerts((prev) => [...prev, alert]);
    setShowCreate(false);
    setNewAlert({ name: '', type: 'PRICE', tokenSymbol: '', condition: 'above', target: '', notifyInApp: true, notifyEmail: false });
  }

  function toggleAlert(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  }

  function deleteAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const TYPE_COLORS: Record<Alert['type'], string> = {
    PRICE: '#00E5FF',
    VOLUME: '#FFD23F',
    WHALE: '#FF6B35',
    NEW_POOL: '#0A1EFF',
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell size={24} className="text-bingo-orange" />
              Alerts
            </h1>
            <p className="text-text-secondary text-sm mt-1">Get notified on price movements, whale activity, and more</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-neon-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            New Alert
          </button>
        </div>

        {/* Create Alert Form */}
        {showCreate && (
          <div className="bg-bg-secondary border border-neon-blue/40 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-white mb-4">Create Alert</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newAlert.name}
                onChange={(e) => setNewAlert((p) => ({ ...p, name: e.target.value }))}
                placeholder="Alert name"
                className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-neon-blue"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Type</label>
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert((p) => ({ ...p, type: e.target.value as Alert['type'] }))}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
                  >
                    <option value="PRICE">Price Alert</option>
                    <option value="VOLUME">Volume Alert</option>
                    <option value="WHALE">Whale Movement</option>
                    <option value="NEW_POOL">New Pool</option>
                  </select>
                </div>
                {newAlert.type === 'PRICE' && (
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Token</label>
                    <input
                      type="text"
                      value={newAlert.tokenSymbol}
                      onChange={(e) => setNewAlert((p) => ({ ...p, tokenSymbol: e.target.value.toUpperCase() }))}
                      placeholder="ETH, BTC..."
                      className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-neon-blue"
                    />
                  </div>
                )}
              </div>
              {newAlert.type === 'PRICE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Condition</label>
                    <select
                      value={newAlert.condition}
                      onChange={(e) => setNewAlert((p) => ({ ...p, condition: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none"
                    >
                      <option value="above">Price Above</option>
                      <option value="below">Price Below</option>
                      <option value="change_up">Change Up %</option>
                      <option value="change_down">Change Down %</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Target</label>
                    <input
                      type="number"
                      value={newAlert.target}
                      onChange={(e) => setNewAlert((p) => ({ ...p, target: e.target.value }))}
                      placeholder="$0.00"
                      className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-neon-blue"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAlert.notifyInApp}
                    onChange={(e) => setNewAlert((p) => ({ ...p, notifyInApp: e.target.checked }))}
                    className="accent-neon-blue"
                  />
                  <span className="text-sm text-text-secondary">In-app notification</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAlert.notifyEmail}
                    onChange={(e) => setNewAlert((p) => ({ ...p, notifyEmail: e.target.checked }))}
                    className="accent-neon-blue"
                  />
                  <span className="text-sm text-text-secondary">Email notification</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createAlert}
                  className="bg-neon-blue text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all"
                >
                  Create Alert
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="bg-bg-tertiary text-text-secondary px-6 py-2.5 rounded-lg text-sm hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert List */}
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-bg-secondary border rounded-xl p-4 transition-all ${
                alert.active ? 'border-border-default' : 'border-border-subtle opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[alert.type], boxShadow: alert.active ? `0 0 6px ${TYPE_COLORS[alert.type]}` : 'none' }}
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">{alert.name}</div>
                    <div className="text-xs text-text-tertiary">
                      {alert.tokenSymbol && `${alert.tokenSymbol} · `}
                      {alert.condition} {alert.target ? `$${alert.target.toLocaleString()}` : ''} ·{' '}
                      <span style={{ color: TYPE_COLORS[alert.type] }}>{alert.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className="text-text-tertiary hover:text-white transition-colors"
                  >
                    {alert.active ? (
                      <ToggleRight size={22} className="text-electric-blue" />
                    ) : (
                      <ToggleLeft size={22} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="text-text-tertiary hover:text-bingo-orange transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {alerts.length === 0 && !showCreate && (
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-12 text-center">
              <Bell size={48} className="text-text-tertiary mx-auto mb-4" />
              <div className="text-text-secondary mb-2">No alerts configured</div>
              <div className="text-text-tertiary text-sm">Create your first alert to get notified on market events</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
