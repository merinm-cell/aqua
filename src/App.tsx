import { Droplets } from 'lucide-react';
import { useMqtt } from './hooks/useMqtt';
import { StatusIndicator } from './components/StatusIndicator';
import { SummaryCards } from './components/SummaryCards';
import { LineChart } from './components/LineChart';
import { MessageLog } from './components/MessageLog';

function App() {
  const { isConnected, latestReading, error } = useMqtt();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Water Quality Monitor
                </h1>
                <p className="text-sm text-gray-600">Real-time IoT Dashboard</p>
              </div>
            </div>
            <StatusIndicator isConnected={isConnected} error={error} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <SummaryCards reading={latestReading} />

          <LineChart latestReading={latestReading} />

          <MessageLog latestReading={latestReading} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            IoT Water Quality Monitoring System - Real-time MQTT Data Stream
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
