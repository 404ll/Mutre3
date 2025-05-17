import { useEffect, useState } from "react";
import { WateringEvent } from "@/types/contract";
import { queryWaterEvent } from "@/contracts/query";

export const EventNotificationBar = () => {
  const [recentEvents, setRecentEvents] = useState<WateringEvent[]>([]);

  useEffect(() => {
    const fetchRecentEvents = async () => {
      const events = await queryWaterEvent();
      setRecentEvents(events);
      console.log("Recent Watering Events:", events);
    };

    // Periodically fetch recent events
    const interval = setInterval(() => {
      fetchRecentEvents();
    }, 6000);

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-14 w-full bg-gradient-to-r from-blue-900/70 to-green-900/70 border-b border-blue-500/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center">
          {/* Left: Event Content */}
          <div className="flex items-center space-x-2 flex-grow overflow-hidden">
            <div className="flex items-center flex-shrink-0">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2"></span>
            </div>
            <div className="flex overflow-hidden w-full">
              <div className="animate-marquee whitespace-nowrap w-full">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event, index) => (
                    <span key={index} className="text-sm text-blue-100 mx-4">
                      💧 {event.owner} just watered {event.amount / 1000000000} HOH
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-blue-100 mx-4">
                    🌱 No recent watering events
                  </span>
                )}
                <span className="text-sm text-blue-100 mx-4">
                  💧 Watering event ongoing - Participate to earn rewards!
                </span>
                <span className="text-sm text-blue-100 mx-4">
                  🔄 New exchange rate active - 1 SUI = 3 HOH
                </span>
              </div>
            </div>
          </div>

          {/* Right: Price Tag */}
          <div className="flex items-center flex-shrink-0 ml-4">
            <span className="text-xs text-blue-300 bg-blue-900/50 px-2 py-1 rounded-full border border-blue-500/30">
              HOH price: 0.33 SUI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};