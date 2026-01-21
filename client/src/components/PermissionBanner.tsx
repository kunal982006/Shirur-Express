// client/src/components/PermissionBanner.tsx
// Permission warning banner for Android app users

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, BellOff, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionStatus {
    displayOverApps: boolean;
    batteryOptimization: boolean;
    notifications: boolean;
    fullScreenIntent: boolean;
}

declare global {
    interface Window {
        AndroidApp?: {
            isNativeApp: () => boolean;
            getFcmToken: () => string;
            getPermissionStatus: () => string;
            areAllPermissionsGranted: () => boolean;
            requestSystemPermissions: () => void;
            requestDisplayOverApps: () => void;
            requestBatteryOptimization: () => void;
            showToast: (message: string) => void;
        };
    }
}

export const PermissionBanner: React.FC = () => {
    const [isNativeApp, setIsNativeApp] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const checkPermissions = () => {
        if (typeof window !== 'undefined' && window.AndroidApp) {
            try {
                setIsNativeApp(window.AndroidApp.isNativeApp());

                const statusJson = window.AndroidApp.getPermissionStatus();
                const status = JSON.parse(statusJson) as PermissionStatus;
                setPermissionStatus(status);

                console.log('[PermissionBanner] Status:', status);
            } catch (error) {
                console.error('[PermissionBanner] Error checking permissions:', error);
            }
        }
        setIsChecking(false);
    };

    useEffect(() => {
        // Initial check
        checkPermissions();

        // Re-check when user returns to the app (visibility change)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[PermissionBanner] App became visible, re-checking permissions...');
                checkPermissions();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also check on focus (for when returning from settings)
        window.addEventListener('focus', checkPermissions);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', checkPermissions);
        };
    }, []);

    // Don't show if:
    // - Not a native app
    // - Still checking
    // - All permissions granted
    // - User dismissed
    if (!isNativeApp || isChecking || isDismissed) {
        return null;
    }

    if (permissionStatus === null) {
        return null;
    }

    // Check if any critical permission is missing
    const hasMissingPermissions =
        !permissionStatus.notifications ||
        !permissionStatus.batteryOptimization ||
        !permissionStatus.fullScreenIntent;

    if (!hasMissingPermissions) {
        return null;
    }

    const handleRequestPermissions = () => {
        if (window.AndroidApp) {
            window.AndroidApp.requestSystemPermissions();
        }
    };

    // Determine severity
    const isCritical = !permissionStatus.notifications || !permissionStatus.batteryOptimization;

    return (
        <div
            className={`
        relative overflow-hidden rounded-lg p-4 mb-6 
        ${isCritical
                    ? 'bg-gradient-to-r from-red-500/10 via-red-500/5 to-orange-500/10 border-2 border-red-500/30'
                    : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-yellow-500/10 border-2 border-amber-500/30'
                }
        animate-pulse-slow
      `}
        >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            currentColor 10px,
            currentColor 11px
          )`
                }} />
            </div>

            <div className="relative flex items-start gap-4">
                {/* Icon */}
                <div className={`
          flex-shrink-0 p-3 rounded-full
          ${isCritical
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-amber-500/20 text-amber-500'
                    }
        `}>
                    {isCritical ? (
                        <BellOff className="h-6 w-6 animate-bounce" />
                    ) : (
                        <AlertTriangle className="h-6 w-6" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className={`
            font-bold text-lg mb-1
            ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}
          `}>
                        {isCritical ? '⚠️ Orders May Not Ring!' : '⚡ Optimize Notifications'}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-3">
                        {isCritical
                            ? 'Critical permissions are missing. You may miss new orders when your phone is sleeping or the app is in background.'
                            : 'Some optional permissions are missing. Enable them for the best experience.'
                        }
                    </p>

                    {/* Missing permissions list */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {!permissionStatus.notifications && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-600 dark:text-red-400">
                                <Bell className="h-3 w-3" /> Notifications
                            </span>
                        )}
                        {!permissionStatus.batteryOptimization && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-600 dark:text-red-400">
                                <Shield className="h-3 w-3" /> Battery Optimization
                            </span>
                        )}
                        {!permissionStatus.fullScreenIntent && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-3 w-3" /> Full Screen Alerts
                            </span>
                        )}
                    </div>

                    {/* Action button */}
                    <Button
                        onClick={handleRequestPermissions}
                        className={`
              ${isCritical
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                            }
            `}
                        size="sm"
                    >
                        <Shield className="h-4 w-4 mr-2" />
                        Enable Permissions
                    </Button>
                </div>

                {/* Dismiss button */}
                <button
                    onClick={() => setIsDismissed(true)}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="h-5 w-5 text-muted-foreground" />
                </button>
            </div>

            {/* Animated border glow for critical */}
            {isCritical && (
                <div className="absolute inset-0 rounded-lg pointer-events-none">
                    <div className="absolute inset-0 rounded-lg animate-pulse border-2 border-red-500/50" />
                </div>
            )}
        </div>
    );
};

export default PermissionBanner;
