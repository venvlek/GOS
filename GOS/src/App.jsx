import React, { useCallback, useEffect, useState } from 'react';
import { C } from './lib/theme';
import { storageGet, storageSet, CONFIG_KEY } from './lib/storage';
import Shell from './components/ui/Shell';
import LoadingScreen from './components/ui/LoadingScreen';
import LoginScreen from './components/auth/LoginScreen';
import PrincipalApp from './components/principal/PrincipalApp';
import TeacherApp from './components/teacher/TeacherApp';
import InstallBanner from './components/shared/InstallBanner';

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

  let content;
  if (loading) {
    content = <LoadingScreen />;
  } else if (!config) {
    content = (
      <Shell>
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <div className="goss-serif" style={{ fontSize: 18, color: C.rose }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 6 }}>{loadError || 'Please refresh the page.'}</div>
          </div>
        </div>
      </Shell>
    );
  } else if (!user) {
    content = <LoginScreen config={config} onLogin={setUser} />;
  } else if (user.role === 'principal') {
    content = <PrincipalApp config={config} setConfig={setConfig} onLogout={() => setUser(null)} />;
  } else {
    // Re-resolve the teacher record from live config, in case the principal
    // edited it (name/PIN/classes) after this person signed in.
    const teacher = config.teachers.find((t) => t.id === user.teacher.id) || user.teacher;
    content = <TeacherApp config={config} teacher={teacher} onLogout={() => setUser(null)} />;
  }

  return (
    <>
      <InstallBanner />
      {content}
    </>
  );
}
