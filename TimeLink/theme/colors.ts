// theme/colors.ts

export interface Colors {
  background: string;      // page background
  text: string;            // primary text
  border: string;          // divider lines, inputs
  primary: string;         // main action (buttons, links)
  secondary: string;       // muted text, placeholders
  inputBg: string;         // form backgrounds
  card: string;            // cards or surface backgrounds
  accent: string;          // accent highlight (toggles, badges)
  notification: string;    // destructive actions, alerts
}

export const LightColors: Colors = {
  background:   '#FFFFFF',
  text:         '#1A1A1A',
  border:       '#E5E5E5',
  primary:      '#3D5AFE',
  secondary:    '#757575',
  inputBg:      '#F6F6F6',
  card:         '#FFFFFF',
  accent:       '#FF4081',
  notification: '#D32F2F',
};

export const DarkColors: Colors = {
  background:   '#1A1A1A',
  text:         '#FFFFFF',
  border:       '#333333',
  primary:      '#82B1FF',
  secondary:    '#B0BEC5',
  inputBg:      '#2A2A2A',
  card:         '#2C2C2C',
  accent:       '#FF80AB',
  notification: '#EF5350',
};