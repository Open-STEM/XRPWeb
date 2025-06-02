import Accelerometer from "./sensors/Accelerometer";
import Current from "./sensors/Current";
import Encoder from "./sensors/Encoder";
import Gyroscope from "./sensors/Gyroscope";
import Rangefinder from "./sensors/Rangefinder";
import Reflectance from "./sensors/Reflectance";
import Voltage from "./sensors/Voltage";

export default function XRPDashboard() {
  return (
    <div className="w-full max-w-8xl mx-auto p-8 bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 ">
        {/* Each sensor component gets equal space in the grid */}
        <div className="w-full h-[280px] bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 bg-gray-700/95">
          <Gyroscope />
        </div>
        <div className="w-full h-[280px] bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 bg-gray-700/95">
          <Accelerometer />
        </div>
        <div className="w-full h-[280px] bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 bg-gray-700/95">
          <Current />
        </div>
        <div className="w-full h-[280px] bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 bg-gray-700/95">
          <Encoder />
        </div>
        <div className="w-full h-[280px] bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 bg-gray-700/95">
          <Voltage />
        </div>
        <div className="w-full h-[280px] bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 bg-gray-700/95">
          <Reflectance />
        </div>
        <div className="w-full h-[280px] bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 bg-gray-700/95">
          <Rangefinder />
        </div>
      </div>
    </div>
  )
}