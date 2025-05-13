import Accelerometer from "./sensors/Accelerometer";
import Gyroscope from "./sensors/Gyroscope";

export default function XRPDashboard() {
  return (
    <div className="flex flex-col w-[400px] h-[400px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <Gyroscope />
      <Accelerometer />
    </div>
  )
}