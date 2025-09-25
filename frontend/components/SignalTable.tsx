import { Signal } from '@/lib/api';

interface SignalTableProps {
  signals: Signal[];
}

export const SignalTable = ({ signals }: SignalTableProps) => {
  if (!signals.length) {
    return <p>No signals available yet. Trigger a refresh to generate new signals.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Pair</th>
          <th>Timeframe</th>
          <th>Direction</th>
          <th>Entry</th>
          <th>Target</th>
          <th>Stop Loss</th>
          <th>Generated</th>
        </tr>
      </thead>
      <tbody>
        {signals.map((signal) => (
          <tr key={signal.id}>
            <td>{signal.symbol}</td>
            <td>{signal.timeframe}</td>
            <td>{signal.direction}</td>
            <td>{signal.entry_price.toFixed(2)}</td>
            <td>{signal.target_price.toFixed(2)}</td>
            <td>{signal.stop_loss.toFixed(2)}</td>
            <td>{new Date(signal.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SignalTable;
