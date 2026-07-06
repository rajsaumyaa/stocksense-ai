import React, { useState } from 'react';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import { 
  FileSpreadsheet, 
  Brain, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  UploadCloud, 
  Compass 
} from 'lucide-react';

export const Settings: React.FC = () => {
  // CSV Upload States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string; data?: any } | null>(null);

  // Model training States
  const [training, setTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState<{ type: 'success' | 'error'; message: string; data?: any } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setUploading(true);
    setUploadStatus(null);
    try {
      const res = await api.uploadCSV(csvFile);
      setUploadStatus({
        type: 'success',
        message: res.message || 'Dataset uploaded and clean synced successfully.',
        data: res.metrics
      });
      setCsvFile(null);
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        message: err.message || 'Failed to process CSV file.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTrainModel = async () => {
    setTraining(true);
    setTrainStatus(null);
    try {
      const res = await api.trainForecastModel();
      setTrainStatus({
        type: 'success',
        message: res.message || 'XGBoost forecast model trained successfully.',
        data: res.metrics
      });
    } catch (err: any) {
      setTrainStatus({
        type: 'error',
        message: err.message || 'Model training failed.'
      });
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CSV Ingestion Panel */}
        <GlassCard title="Data Ingestion Portal" subtitle="Upload CSV sales and stock levels.">
          <form onSubmit={handleCSVUpload} className="space-y-4">
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-colors">
              <UploadCloud size={32} className="text-zinc-400 mb-3" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {csvFile ? csvFile.name : 'Select retail CSV file'}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                CSV should contain SKU, product name, current stock, sales quantity, etc.
              </p>
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="csv-file-input"
                className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Browse Files
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !csvFile}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Cleaning and Syncing...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={16} />
                  <span>Upload Retail Dataset</span>
                </>
              )}
            </button>
          </form>

          {uploadStatus && (
            <div className={`mt-6 p-4 rounded-xl border space-y-2 text-sm ${
              uploadStatus.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            }`}>
              <div className="flex items-center space-x-2 font-bold">
                {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{uploadStatus.message}</span>
              </div>
              {uploadStatus.data && (
                <ul className="text-xs list-disc list-inside space-y-1 mt-1 text-zinc-500 dark:text-zinc-400 font-medium">
                  <li>Total cleaned transactions processed: {uploadStatus.data.total_rows_processed}</li>
                  <li>New products created/updated: {uploadStatus.data.products_upserted}</li>
                  <li>New sales entries written: {uploadStatus.data.sales_recorded}</li>
                </ul>
              )}
            </div>
          )}
        </GlassCard>

        {/* XGBoost Forecasting Model Trainer */}
        <GlassCard title="Demand Forecaster Diagnostics" subtitle="Train the XGBoost regressor model.">
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              Training queries your historical database, transforms dates into lag structures (past 1, 7 days sales) and calendar seasonality matrices, and fits an XGBoost decision tree ensemble.
            </p>
            
            <button
              onClick={handleTrainModel}
              disabled={training}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
            >
              {training ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Training XGBoost Regressor...</span>
                </>
              ) : (
                <>
                  <Brain size={16} />
                  <span>Execute Model Re-Training</span>
                </>
              )}
            </button>
          </div>

          {trainStatus && (
            <div className={`mt-6 p-4 rounded-xl border space-y-2 text-sm ${
              trainStatus.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
            }`}>
              <div className="flex items-center space-x-2 font-bold">
                {trainStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{trainStatus.message}</span>
              </div>
              {trainStatus.data && (
                <ul className="text-xs list-disc list-inside space-y-1 mt-1 text-zinc-500 dark:text-zinc-400 font-medium">
                  <li>Evaluation $R^2$ Score: {trainStatus.data.r2_score.toFixed(4)}</li>
                  <li>Mean Squared Error (MSE): {trainStatus.data.mse.toFixed(2)}</li>
                  <li>Overall model prediction confidence: {trainStatus.data.confidence_score}%</li>
                </ul>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Looker Studio Integration Guide */}
      <GlassCard title="Looker Studio Integration" subtitle="How to connect reporting sheets.">
        <div className="space-y-6">
          <div className="flex items-start space-x-3 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/40 p-4.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/30">
            <Compass size={22} className="text-emerald-600 dark:text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed font-medium">
              To connect your Google Looker Studio dashboard, configure a **PostgreSQL Data Source** pointing to the StockSense DB. We expose three views optimized for direct visualization:
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-xl space-y-2">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white font-mono">v_sales_trends</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                Aggregates sales records by day, category, and product name. Perfect for building line charts and revenue scorecards.
              </p>
            </div>
            
            <div className="border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-xl space-y-2">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white font-mono">v_inventory_health</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                Compares current stock, reorder level, and categorizes status as LOW STOCK, OVERSTOCK, or HEALTHY.
              </p>
            </div>
            
            <div className="border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-xl space-y-2">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white font-mono">v_demand_forecast</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                Joins XGBoost output dates to products. Best for comparing future demand lines vs warehouse limits.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Connecting Query Example:</h4>
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`SELECT 
  sale_date, 
  category, 
  total_revenue 
FROM v_sales_trends 
WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days';`}
            </pre>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Settings;
