import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react";

// 定义 leaderboardData 类型
type LeaderboardItem = {
  id: string | number;
  address: string;
  tokens: number;
};

// 排行榜项组件 - 移除动画效果
export const LeaderboardItem = ({
  item,
  index,
}: {
  item: LeaderboardItem;
  index: number;
}) => {
  const getRankColor = (rank: number) => {
    if (rank === 0) return "bg-yellow-500";
    if (rank === 1) return "bg-gray-400";
    if (rank === 2) return "bg-amber-600";
    return "bg-blue-600";
  };

  return (
    <div className="relative">
      <div
        className={`
        flex items-center p-4 rounded-lg mb-3
        ${index < 3 ? "bg-gradient-to-r from-blue-900/50 to-green-900/50 border border-blue-500/30 neon-border" : "glass-effect border border-blue-500/20"}
        hover:shadow-md transition-all duration-300 hover:scale-[1.02] group
      `}
      >
        <div
          className={`
          ${getRankColor(index)}
          w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-4
        `}
        >
          {index + 1}
        </div>

        <Avatar className="h-10 w-10 border-2 border-blue-500/30 mr-4">
          <div className="flex items-center justify-center w-full h-full bg-blue-900/50 text-blue-300 text-xs">
            {item.address.substring(0, 2)}
          </div>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-medium text-blue-100">{item.address}</span>
            {index < 3 && (
              <Badge variant="outline" className="ml-2 bg-blue-900/50 text-blue-300 border-blue-500/30">
                Top {index + 1}
              </Badge>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-blue-300 neon-text">{item.tokens.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Burn Amount</div>
        </div>

        {/* 静态星星图标，仅在悬停时显示 */}
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
      </div>
    </div>
  );
};

// 导出组件
export default LeaderboardItem;