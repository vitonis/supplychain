import { FiArrowUp, FiArrowDown } from "react-icons/fi";

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  changeType,
  loading,
}) => {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500 via-blue-600 to-cyan-600",
      glow: "from-blue-500/20 to-cyan-500/20",
      text: "text-blue-600 dark:text-blue-400",
      bg: "from-blue-50/50 to-cyan-50/50 dark:from-blue-900/20 dark:to-cyan-900/20",
      border: "border-blue-200/50 dark:border-blue-800/50",
      shadow: "shadow-blue-500/25",
    },
    green: {
      gradient: "from-green-500 via-emerald-600 to-teal-600",
      glow: "from-green-500/20 to-teal-500/20",
      text: "text-green-600 dark:text-green-400",
      bg: "from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20",
      border: "border-green-200/50 dark:border-green-800/50",
      shadow: "shadow-green-500/25",
    },
    purple: {
      gradient: "from-purple-500 via-violet-600 to-indigo-600",
      glow: "from-purple-500/20 to-indigo-500/20",
      text: "text-purple-600 dark:text-purple-400",
      bg: "from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20",
      border: "border-purple-200/50 dark:border-purple-800/50",
      shadow: "shadow-purple-500/25",
    },
    orange: {
      gradient: "from-orange-500 via-amber-600 to-yellow-600",
      glow: "from-orange-500/20 to-yellow-500/20",
      text: "text-orange-600 dark:text-orange-400",
      bg: "from-orange-50/50 to-yellow-50/50 dark:from-orange-900/20 dark:to-yellow-900/20",
      border: "border-orange-200/50 dark:border-orange-800/50",
      shadow: "shadow-orange-500/25",
    },
    red: {
      gradient: "from-red-500 via-rose-600 to-pink-600",
      glow: "from-red-500/20 to-pink-500/20",
      text: "text-red-600 dark:text-red-400",
      bg: "from-red-50/50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/20",
      border: "border-red-200/50 dark:border-red-800/50",
      shadow: "shadow-red-500/25",
    },
  };

  const changeColorClasses = {
    increase:
      "text-green-600 dark:text-green-400 bg-green-100/50 dark:bg-green-900/30",
    decrease: "text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/30",
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  if (loading) {
    return (
      <div className="relative group">
        {/* Loading glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-300/20 to-gray-400/20 dark:from-gray-600/20 dark:to-gray-700/20 rounded-3xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

        <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl shadow-gray-500/5 dark:shadow-gray-500/10">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full w-24"></div>
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl"></div>
            </div>

            {/* Value skeleton */}
            <div className="space-y-3">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-20"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full w-16"></div>
            </div>
          </div>

          {/* Loading pulse overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-gray-800/10 transform -skew-x-12 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Enhanced glow effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${currentColor.glow} rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all duration-500`}
      ></div>

      <div
        className={`relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/30 p-8 shadow-xl ${currentColor.shadow} hover:shadow-2xl transition-all duration-500 group-hover:scale-105`}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase">
              {title}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Live Data
              </span>
            </div>
          </div>

          {/* Enhanced icon container */}
          <div className="relative">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentColor.gradient} flex items-center justify-center shadow-lg ${currentColor.shadow} transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
            >
              <Icon className="w-7 h-7 text-white drop-shadow-sm" />
            </div>
            {/* Icon glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"></div>
            {/* Pulse indicator */}
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r ${currentColor.gradient} rounded-full border-2 border-white dark:border-gray-800 animate-pulse`}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-end justify-between">
          <div className="space-y-2">
            {/* Value with enhanced styling */}
            <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent leading-none">
              {value}
            </p>

            {/* Change indicator */}
            {change && (
              <div
                className={`
                inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-bold
                ${changeColorClasses[changeType]} border border-current/20
                transform group-hover:scale-105 transition-all duration-300
              `}
              >
                <div className="flex items-center space-x-1">
                  {changeType === "increase" ? (
                    <FiArrowUp className="w-4 h-4" />
                  ) : (
                    <FiArrowDown className="w-4 h-4" />
                  )}
                  <span>{change}</span>
                </div>

                {/* Trend indicator */}
                <div className="flex space-x-0.5">
                  <div
                    className={`w-1 h-1 rounded-full ${
                      changeType === "increase" ? "bg-green-500" : "bg-red-500"
                    } animate-ping delay-100`}
                  ></div>
                  <div
                    className={`w-1 h-1 rounded-full ${
                      changeType === "increase" ? "bg-green-500" : "bg-red-500"
                    } animate-ping delay-200`}
                  ></div>
                  <div
                    className={`w-1 h-1 rounded-full ${
                      changeType === "increase" ? "bg-green-500" : "bg-red-500"
                    } animate-ping delay-300`}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Decorative elements */}
          <div className="flex flex-col items-end space-y-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            <div
              className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentColor.gradient} animate-pulse`}
            ></div>
            <div
              className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${currentColor.gradient} animate-pulse delay-500`}
            ></div>
            <div
              className={`w-1 h-1 rounded-full bg-gradient-to-r ${currentColor.gradient} animate-pulse delay-1000`}
            ></div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${currentColor.gradient} rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        ></div>

        {/* Corner decorations */}
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/10 dark:border-gray-700/30 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/10 dark:border-gray-700/30 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </div>
  );
};

export default StatsCard;
