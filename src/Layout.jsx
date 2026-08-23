import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

import NotificationBell from "./components/notifications/NotificationBell";
import CyberNav from "./components/navigation/CyberNav";
import BottomNav from "./components/navigation/BottomNav";
import { getNavigationGroups } from "./components/navigation/navigationConfig";

export default function Layout({ children, currentPageName }) {
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    base44.auth.me().then(async (authUser) => {
      let mergedUser = authUser;
      try {
        const profileResponse = await base44.functions.invoke('getCurrentUserProfile', {});
        mergedUser = profileResponse.data.user || authUser;
      } catch (error) {
        mergedUser = authUser;
      }
      const baseRole = mergedUser.role || "user";
      const hasSubscriberProfile = mergedUser.account_type === "assinante" || mergedUser.assinatura_status || mergedUser.assinatura_vencimento || mergedUser.assinatura_origem || mergedUser.stripe_subscription_id;
      const effectiveRole = hasSubscriberProfile && !["admin", "personal", "recente", "bloqueado"].includes(baseRole)
        ? "assinante"
        : baseRole;
      setRole(effectiveRole);
      const rawName = [mergedUser.display_name, mergedUser.full_name, mergedUser.name, mergedUser.nome].find(value => typeof value === "string" && !["", "lost", "undefined", "null", "nan"].includes(value.trim().toLowerCase()));
      const emailName = mergedUser.email?.split("@")[0]?.replace(/[._-]+/g, " ") || "";
      const roleFallback = effectiveRole === "admin" ? "Administrador" : "Professor";
      const profileName = rawName || (!["", "lost", "undefined", "null"].includes(emailName.toLowerCase()) ? emailName : roleFallback);
      const hasPremiumProfile = ["admin", "personal", "user", "assinante"].includes(effectiveRole);
      setUserName(hasPremiumProfile ? profileName : (mergedUser.full_name || mergedUser.email || ""));
      let avatar = mergedUser.photo_url || mergedUser.avatar_url || mergedUser.profile_image || "";
      if (!avatar && ["personal", "user"].includes(effectiveRole)) {
        const profiles = await base44.entities.Student.filter({ email: mergedUser.email }, "-created_date", 1);
        avatar = profiles[0]?.photo_url || "";
      }
      setUserAvatar(avatar);
    }).catch(() => setRole("user"));
  }, []);

  const isAdmin = role === "admin";
  const isPersonal = role === "personal";
  const isSubscriber = role === "assinante";
  const isAppProfile = role === "personal" || role === "user" || role === "assinante";
  const hasPremiumHeader = isAdmin || isAppProfile;
  const navGroups = getNavigationGroups(role);
  const isProfileDashboard = (isAdmin && currentPageName === "AdminDashboard") || (isPersonal && currentPageName === "PersonalDashboard") || (role === "user" && currentPageName === "StudentDashboard") || (isSubscriber && currentPageName === "SubscriberDashboard");

  const NavLink = ({ item }) => {
    const isActive = currentPageName === item.page;
    return (
      <motion.div whileHover={{ x: isActive ? 0 : 2 }} transition={{ duration: 0.13 }}>
        <Link
          to={createPageUrl(item.page)}
          className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 mx-2"
          style={isActive ? {
            background: `color-mix(in srgb, var(--neon-purple) 18%, transparent)`,
            border: `1px solid color-mix(in srgb, var(--neon-purple) 60%, transparent)`,
            boxShadow: `0 0 18px color-mix(in srgb, var(--neon-purple) 35%, transparent), inset 0 0 10px color-mix(in srgb, var(--neon-purple) 10%, transparent)`,
          } : {
            border: '1px solid transparent',
          }}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
              style={{ background: 'var(--neon-purple)', boxShadow: `0 0 10px var(--neon-purple), 0 0 20px color-mix(in srgb, var(--neon-purple) 50%, transparent)` }} />
          )}
          <item.icon
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{
              color: isActive ? '#fff' : 'color-mix(in srgb, var(--neon-purple) 85%, white)',
              filter: isActive
                ? `drop-shadow(0 0 5px #fff) drop-shadow(0 0 10px var(--neon-purple)) drop-shadow(0 0 18px color-mix(in srgb, var(--neon-purple) 60%, transparent))`
                : `drop-shadow(0 0 4px color-mix(in srgb, var(--neon-purple) 65%, transparent))`,
            }}
          />
          <span className="text-xs font-medium leading-tight"
            style={{
              color: isActive ? '#ffffff' : 'var(--text-primary)',
              textShadow: isActive ? `0 0 10px var(--neon-purple), 0 0 22px color-mix(in srgb, var(--neon-purple) 70%, transparent)` : 'none',
            }}>
            {item.name}
          </span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--neon-purple)', boxShadow: `0 0 8px var(--neon-purple), 0 0 16px color-mix(in srgb, var(--neon-purple) 50%, transparent)` }} />
          )}
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="premium-app-shell min-h-screen text-app-text">

      {/* Mobile Header */}
      {hasPremiumHeader ? (
        <header className="app-glass-header fixed left-0 right-0 top-0 z-50 lg:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="mx-auto flex h-[72px] w-full max-w-[430px] items-center justify-between px-4">
            <Link to="/" aria-label="Ir para o início" className="flex min-w-0 items-center gap-3">
              <div className="app-glass-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[22px] font-black italic tracking-[-0.08em] text-professor">BZ</div>
              <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-professor">BZ Gym System</p></div>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell premium />
              <Link to="/Profile" aria-label="Abrir perfil" className="app-glass-icon flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-purple-100">
                {userAvatar ? <img src={userAvatar} alt="Perfil" className="h-full w-full object-cover" /> : userName.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
              </Link>
            </div>
          </div>
        </header>
      ) : (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-md px-4 py-3 flex items-center justify-between"
          style={{
            background: 'color-mix(in srgb, var(--bg-void) 95%, transparent)',
            borderBottom: '1px solid color-mix(in srgb, var(--neon-purple) 40%, transparent)',
            boxShadow: '0 2px 20px color-mix(in srgb, var(--neon-purple) 15%, transparent)',
            paddingTop: 'max(0.75rem, env(safe-area-inset-top))'
          }}>
          <Link to="/" aria-label="Ir para o início" className="flex items-baseline gap-0.5 px-2 py-1 rounded-lg"
            style={{
              border: '1px solid color-mix(in srgb, var(--neon-purple) 65%, transparent)',
              background: 'color-mix(in srgb, var(--neon-purple) 12%, transparent)',
              boxShadow: '0 0 20px color-mix(in srgb, var(--neon-purple) 40%, transparent), inset 0 0 8px color-mix(in srgb, var(--neon-purple) 10%, transparent)',
            }}>
            <span className="font-cyber font-black text-2xl leading-none select-none italic" style={{ color: '#ffffff', textShadow: '0 0 14px var(--neon-purple), 0 0 30px color-mix(in srgb, var(--neon-purple) 50%, transparent), 0 0 2px #fff' }}>B</span>
            <span className="font-cyber font-black text-2xl leading-none select-none italic" style={{ color: 'var(--neon-purple)', textShadow: '0 0 18px var(--neon-purple), 0 0 40px color-mix(in srgb, var(--neon-purple) 55%, transparent)' }}>Z</span>
          </Link>
          <div className="flex items-center gap-2"><NotificationBell /><CyberNav role={role} currentPageName={currentPageName} userName={userName} /></div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="app-glass-header fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r border-app-primary/15 lg:flex">

        {/* Logo */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--neon-purple) 35%, transparent)' }}>
          <div className="flex items-baseline gap-1 px-2.5 py-1.5 rounded-xl"
            style={{
              border: '1px solid color-mix(in srgb, var(--neon-purple) 72%, transparent)',
              background: 'color-mix(in srgb, var(--neon-purple) 15%, transparent)',
              boxShadow: '0 0 28px color-mix(in srgb, var(--neon-purple) 55%, transparent), inset 0 0 14px color-mix(in srgb, var(--neon-purple) 12%, transparent)',
            }}>
            <span className="font-cyber font-black text-3xl leading-none select-none italic"
              style={{ color: '#ffffff', textShadow: '0 0 16px var(--neon-purple), 0 0 36px color-mix(in srgb, var(--neon-purple) 60%, transparent), 0 0 3px #fff' }}>B</span>
            <span className="font-cyber font-black text-3xl leading-none select-none italic"
              style={{ color: 'var(--neon-purple)', textShadow: '0 0 20px var(--neon-purple), 0 0 48px color-mix(in srgb, var(--neon-purple) 65%, transparent), 0 0 72px color-mix(in srgb, var(--neon-purple) 30%, transparent)' }}>Z</span>
            <span className="ml-1.5 text-[9px] font-mono-cyber tracking-widest uppercase self-end pb-0.5"
              style={{ color: 'color-mix(in srgb, var(--neon-purple) 90%, white)', textShadow: '0 0 10px var(--neon-purple)' }}>GYM</span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid color-mix(in srgb, var(--neon-purple) 30%, transparent)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{
              borderColor: 'color-mix(in srgb, var(--neon-purple) 55%, transparent)',
              background: 'color-mix(in srgb, var(--neon-purple) 16%, transparent)',
              boxShadow: '0 0 18px color-mix(in srgb, var(--neon-purple) 25%, transparent), inset 0 0 10px color-mix(in srgb, var(--neon-purple) 8%, transparent)'
            }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--neon-purple)', boxShadow: '0 0 8px var(--neon-purple), 0 0 16px color-mix(in srgb, var(--neon-purple) 50%, transparent)' }} />
            <span className="text-[10px] font-medium tracking-widest uppercase"
              style={{ color: '#ffffff', textShadow: '0 0 8px var(--neon-purple)' }}>
              {isAdmin ? "Administrador" : isPersonal ? "Personal Trainer" : isSubscriber ? "Assinante" : "Aluno"}
            </span>
          </div>
          {userName && (
            <p className="text-[10px] mt-2 px-1 truncate font-mono-cyber"
              style={{ color: 'color-mix(in srgb, var(--neon-purple) 75%, white)' }}>{userName}</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="flex items-center gap-1.5 px-5 mb-1.5">
                <div className="h-px flex-1"
                  style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${group.color} 70%, transparent), transparent)` }} />
                <p className="text-[8px] uppercase tracking-[0.28em] font-bold font-mono-cyber whitespace-nowrap"
                  style={{
                    color: group.color,
                    textShadow: `0 0 8px ${group.color}, 0 0 18px ${group.color}88`,
                  }}>
                  {group.label}
                </p>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.page} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="h-px mx-4" style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--neon-purple) 50%, transparent), transparent)' }} />
        <div className="p-3 flex items-center justify-center">
          <p className="text-[9px] font-mono-cyber tracking-widest"
            style={{ color: 'color-mix(in srgb, var(--neon-purple) 70%, white)', textShadow: '0 0 8px var(--neon-purple)' }}>BZ · GYM SYSTEM</p>
        </div>
      </aside>

      {/* Bottom navigation for mobile app profiles */}
      {(role === "admin" || role === "user" || role === "assinante" || role === "personal") && (
        <BottomNav role={role} />
      )}

      {/* Main Content */}
      <main className={`lg:ml-60 min-h-screen ${hasPremiumHeader ? "pt-[calc(76px+env(safe-area-inset-top))] lg:pt-0" : "pt-16 lg:pt-0"} ${(hasPremiumHeader && !isProfileDashboard) ? "pb-24 lg:pb-0" : ""}`}>
        <div className="hidden lg:block fixed top-5 right-6 z-30">
          <NotificationBell />
        </div>
        <motion.div className={isProfileDashboard ? "p-0" : "p-4 md:p-8"}
          key={typeof window !== 'undefined' ? window.location.pathname : 'page'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}