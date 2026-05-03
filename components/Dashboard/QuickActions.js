import Link from "next/link";
import {
  FiPlus,
  FiSearch,
  FiShield,
  FiUser,
  FiBarChart,
  FiSettings,
  FiArrowRight,
  FiBookOpen,
  FiHelpCircle,
  FiMessageCircle,
  FiZap,
} from "react-icons/fi";

const QuickActions = ({ isVerified }) => {
  const actions = [
    {
      title: "Create Shipment",
      description: "Send a new package",
      icon: FiPlus,
      href: "/create-shipment",
      color: "blue",
      enabled: isVerified,
      requiresVerification: true,
    },
    {
      title: "Track Package",
      description: "Find your shipment",
      icon: FiSearch,
      href: "/tracking",
      color: "green",
      enabled: true,
      requiresVerification: false,
    },
    {
      title: "KYC Verification",
      description: "Verify your identity",
      icon: FiShield,
      href: "/kyc",
      color: "purple",
      enabled: true,
      requiresVerification: false,
    },
    {
      title: "My Shipments",
      description: "View reports",
      icon: FiBarChart,
      href: "/shipments",
      color: "indigo",
      enabled: isVerified,
      requiresVerification: true,
    },
  ];

  const colorClasses = {
    blue: {
      gradient: "from-blue-500 via-blue-600 to-cyan-600",
      hoverGradient: "from-blue-600 via-blue-700 to-cyan-700",
      glow: "from-blue-500/20 to-cyan-500/20",
      shadow: "shadow-blue-500/25",
    },
    green: {
      gradient: "from-green-500 via-emerald-600 to-teal-600",
      hoverGradient: "from-green-600 via-emerald-700 to-teal-700",
      glow: "from-green-500/20 to-teal-500/20",
      shadow: "shadow-green-500/25",
    },
    purple: {
      gradient: "from-purple-500 via-violet-600 to-indigo-600",
      hoverGradient: "from-purple-600 via-violet-700 to-indigo-700",
      glow: "from-purple-500/20 to-indigo-500/20",
      shadow: "shadow-purple-500/25",
    },
    indigo: {
      gradient: "from-indigo-500 via-purple-600 to-pink-600",
      hoverGradient: "from-indigo-600 via-purple-700 to-pink-700",
      glow: "from-indigo-500/20 to-pink-500/20",
      shadow: "shadow-indigo-500/25",
    },
  };

  return (
    <div className="relative group">
      {/* Enhanced glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

      <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl shadow-purple-500/5 dark:shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-purple-500/15 transition-all duration-500">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

        {/* Enhanced Header */}
        <div className="relative z-10 flex items-center space-x-4 mb-8">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <FiZap className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
          </div>

          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              Quick Actions
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Instant Access
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced KYC Warning */}
        {!isVerified && (
          <div className="relative z-10 mb-8 group/warning">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 dark:from-yellow-500/30 dark:to-orange-500/30 rounded-2xl blur opacity-50 group-hover/warning:opacity-75 transition-opacity duration-300"></div>

            <div className="relative p-6 bg-gradient-to-r from-yellow-50/70 to-orange-50/70 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200/50 dark:border-yellow-700/50 rounded-2xl backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                    <FiShield className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-1">
                    KYC Verification Required
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed">
                    Complete identity verification to unlock all features and
                    start creating shipments
                  </p>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping delay-100"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Actions Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const isDisabled = action.requiresVerification && !isVerified;
            const colorConfig = colorClasses[action.color];

            return (
              <div
                key={action.title}
                className="relative group/action"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {action.enabled && !isDisabled ? (
                  <>
                    {/* Action glow effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${colorConfig.glow} rounded-2xl blur opacity-0 group-hover/action:opacity-100 transition-opacity duration-300`}
                    ></div>

                    <Link
                      href={action.href}
                      className={`
                        relative block p-6 rounded-2xl bg-gradient-to-br ${colorConfig.gradient}
                        hover:bg-gradient-to-br hover:${colorConfig.hoverGradient}
                        text-white transition-all duration-300 ${colorConfig.shadow} hover:shadow-xl
                        transform hover:scale-105 hover:-translate-y-1 group/link overflow-hidden
                      `}
                    >
                      {/* Inner glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>

                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transform group-hover/link:scale-110 group-hover/link:rotate-3 transition-all duration-300">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-base mb-1 truncate">
                              {action.title}
                            </p>
                            <p className="text-sm opacity-90 truncate">
                              {action.description}
                            </p>
                          </div>
                        </div>

                        <FiArrowRight className="w-5 h-5 opacity-70 group-hover/link:opacity-100 transform group-hover/link:translate-x-1 transition-all duration-300" />
                      </div>

                      {/* Bottom accent line */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/20 to-transparent rounded-b-2xl"></div>
                    </Link>
                  </>
                ) : (
                  <div className="relative group/disabled">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-300/10 to-gray-400/10 dark:from-gray-600/20 dark:to-gray-700/20 rounded-2xl blur opacity-50"></div>

                    <div
                      className={`
                      relative block p-6 rounded-2xl bg-gradient-to-br from-gray-100/70 to-gray-200/70 dark:from-gray-700/70 dark:to-gray-800/70
                      text-gray-500 dark:text-gray-400 cursor-not-allowed backdrop-blur-sm
                      border border-gray-200/50 dark:border-gray-600/50
                      ${isDisabled ? "opacity-60" : ""} overflow-hidden
                    `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-300/50 dark:bg-gray-600/50 rounded-xl flex items-center justify-center">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-base mb-1 truncate">
                              {action.title}
                            </p>
                            <p className="text-sm truncate">
                              {isDisabled
                                ? "Requires KYC verification"
                                : action.description}
                            </p>
                          </div>
                        </div>

                        {isDisabled && (
                          <div className="flex items-center space-x-1">
                            <FiShield className="w-4 h-4 text-yellow-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Enhanced Help Section */}
        <div className="relative z-10 pt-6 border-t border-white/20 dark:border-gray-700/30">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <FiHelpCircle className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Need Help?
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                title: "Documentation",
                href: "/docs",
                icon: FiBookOpen,
                description: "Complete guides",
              },
              {
                title: "Contact Support",
                href: "/support",
                icon: FiMessageCircle,
                description: "Get assistance",
              },
              {
                title: "FAQ",
                href: "/faq",
                icon: FiHelpCircle,
                description: "Common questions",
              },
            ].map((helpItem, index) => {
              const HelpIcon = helpItem.icon;
              return (
                <Link
                  key={helpItem.title}
                  href={helpItem.href}
                  className="group/help flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-100/70 hover:to-cyan-100/70 dark:hover:from-blue-800/30 dark:hover:to-cyan-800/30 rounded-xl border border-blue-100/50 dark:border-blue-800/50 transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover/help:scale-110 transition-transform duration-300">
                      <HelpIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {helpItem.title}
                      </span>
                      <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                        {helpItem.description}
                      </div>
                    </div>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 transform group-hover/help:translate-x-1 transition-transform duration-300" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </div>
  );
};

export default QuickActions;
