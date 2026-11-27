/* Kit dataviz Lease Lane : tout ce qui dessine une donnée passe par ici.
   import { LineChart, BarChart, StatTile, Sparkline, ProgressBar, CellStrip, Legend, ChartFrame, ChartTable } from '@/composants/dataviz';
   Palette validée et mode d'emploi : src/composants/dataviz/PALETTE.md; couleurs = variables CSS --dv-* (globals.css, bloc « Dataviz »).
   Les composants sont « use client » : un composant serveur peut les importer, mais ne leur passe que des données (pas de fonctions); un format = fonction, donc l'appelant doit être client. */
export { LineChart, AreaChart, StepChart, type LineChartProps, type LineSeries, type LineKind } from './LineChart';
export { BarChart, type BarChartProps, type BarSeries } from './BarChart';
export { StatTile, Sparkline, ProgressBar, BulletBar, CellStrip, type StatTileProps, type SparklineProps, type ProgressBarProps, type Delta, type StripCell, type CellState } from './Figures';
export { ChartFrame, ChartTable, Legend, type LegendItem, type TableSpec, type FrameState } from './Frame';
export { Tooltip, TipContent, type TipState, type TipRow } from './Tooltip';
export { seriesColor, rampStep, compact, niceTicks, useWidth } from './util';
