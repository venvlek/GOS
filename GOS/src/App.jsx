import React, { useCallback, useEffect, useState } from 'react';
import { C } from './lib/theme';
import { storageGet, storageSet, CONFIG_KEY } from './lib/storage';
import Shell from './components/ui/Shell';
import LoadingScreen from './components/ui/LoadingScreen';
import LoginScreen from './components/auth/LoginScreen';
import PrincipalApp from './components/principal/PrincipalApp';
import TeacherApp from './components/teacher/TeacherApp';

const DEFAULT_CONFIG = { classes: [], teachers: [], adminPin: '1234' };

export default function App() {
  const [config, setConfigState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [user, setUser] = useState(null); // { role: 'principal' } | { role: 'teacher', teacher }

  useEffect(() => { init(); }, []);

  async function init() {
    let cfg = await storageGet(CONFIG_KEY, true);
    if (!cfg) {
      cfg = DEFAULT_CONFIG;
      const ok = await storageSet(CONFIG_KEY, cfg, true);
      if (!ok) setLoadError('Could not initialize storage.');
    }
    setConfigState(cfg);
    setLoading(false);
  }

  const setConfig = useCallback(async (next) => {
    setConfigState(next);
    await storageSet(CONFIG_KEY, next, true);
  }, []);

  if (loading) return <LoadingScreen />;

  if (!config) {
    return (
      <Shell>
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <div className="goss-serif" style={{ fontSize: 18, color: C.rose }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 6 }}>{loadError || 'Please refresh the page.'}</div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!user) return <LoginScreen config={config} onLogin={setUser} />;

  if (user.role === 'principal') {
    return <PrincipalApp config={config} setConfig={setConfig} onLogout={() => setUser(null)} />;
  }

  // Re-resolve the teacher record from live config, in case the principal
  // edited it (name/PIN/classes) after this person signed in.
  const teacher = config.teachers.find((t) => t.id === user.teacher.id) || user.teacher;
  return <TeacherApp config={config} teacher={teacher} onLogout={() => setUser(null)} />;
}
