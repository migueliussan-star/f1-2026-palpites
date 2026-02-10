
import { Driver, RaceGP, Team } from './types';

export const TEAM_COLORS: Record<string, string> = {
  'McLaren': '#FF8700',
  'Mercedes': '#27F4D2',
  'Red Bull': '#3671C6',
  'Ferrari': '#E80020',
  'Racing Bulls': '#6692FF',
  'Aston Martin': '#229971',
  'Haas': '#B6BABD',
  'Audi': '#A2A2A2',
  'Alpine': '#0093CC',
  'Cadillac': '#FFCC00',
  'Williams': '#00A0DE'
};

// URL de fallback oficial (silhueta)
export const FALLBACK_IMG = "https://media.formula1.com/content/dam/fom-website/drivers/d_driver_fallback_image.png";

export const DRIVERS: Driver[] = [
  { 
    id: 'norris', name: 'Lando Norris', number: 4, team: 'McLaren', color: TEAM_COLORS['McLaren'], country: 'GBR',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png"
  },
  { 
    id: 'piastri', name: 'Oscar Piastri', number: 81, team: 'McLaren', color: TEAM_COLORS['McLaren'], country: 'AUS',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png"
  },
  { 
    id: 'russell', name: 'George Russell', number: 63, team: 'Mercedes', color: TEAM_COLORS['Mercedes'], country: 'GBR',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png"
  },
  { 
    id: 'antonelli', name: 'Kimi Antonelli', number: 12, team: 'Mercedes', color: TEAM_COLORS['Mercedes'], country: 'ITA',
    // Wikimedia Commons (Estável)
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Andrea_Kimi_Antonelli_Imola_2022.jpg/640px-Andrea_Kimi_Antonelli_Imola_2022.jpg"
  },
  { 
    id: 'verstappen', name: 'Max Verstappen', number: 1, team: 'Red Bull', color: TEAM_COLORS['Red Bull'], country: 'NED',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png"
  },
  { 
    id: 'hadjar', name: 'Isack Hadjar', number: 6, team: 'Red Bull', color: TEAM_COLORS['Red Bull'], country: 'FRA',
    // Wikimedia Commons (Estável)
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Isack_Hadjar_Red_Bull_Ring_2022.jpg/640px-Isack_Hadjar_Red_Bull_Ring_2022.jpg"
  },
  { 
    id: 'leclerc', name: 'Charles Leclerc', number: 16, team: 'Ferrari', color: TEAM_COLORS['Ferrari'], country: 'MON',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png"
  },
  { 
    id: 'hamilton', name: 'Lewis Hamilton', number: 44, team: 'Ferrari', color: TEAM_COLORS['Ferrari'], country: 'GBR',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png"
  },
  { 
    id: 'lawson', name: 'Liam Lawson', number: 30, team: 'Racing Bulls', color: TEAM_COLORS['Racing Bulls'], country: 'NZL',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png"
  },
  { 
    id: 'lindblad', name: 'Arvid Lindblad', number: 41, team: 'Racing Bulls', color: TEAM_COLORS['Racing Bulls'], country: 'GBR',
    // Wikimedia Commons (Estável)
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Arvid_Lindblad_2022.jpg/640px-Arvid_Lindblad_2022.jpg"
  },
  { 
    id: 'alonso', name: 'Fernando Alonso', number: 14, team: 'Aston Martin', color: TEAM_COLORS['Aston Martin'], country: 'ESP',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png"
  },
  { 
    id: 'stroll', name: 'Lance Stroll', number: 18, team: 'Aston Martin', color: TEAM_COLORS['Aston Martin'], country: 'CAN',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png"
  },
  { 
    id: 'ocon', name: 'Esteban Ocon', number: 31, team: 'Haas', color: TEAM_COLORS['Haas'], country: 'FRA',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png"
  },
  { 
    id: 'bearman', name: 'Oliver Bearman', number: 87, team: 'Haas', color: TEAM_COLORS['Haas'], country: 'GBR',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png"
  },
  { 
    id: 'hulkenberg', name: 'Nico Hülkenberg', number: 27, team: 'Audi', color: TEAM_COLORS['Audi'], country: 'GER',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png"
  },
  { 
    id: 'bortoleto', name: 'Gabriel Bortoleto', number: 5, team: 'Audi', color: TEAM_COLORS['Audi'], country: 'BRA',
    // Wikimedia Commons (Estável)
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Gabriel_Bortoleto_F3_2023.jpg/640px-Gabriel_Bortoleto_F3_2023.jpg"
  },
  { 
    id: 'gasly', name: 'Pierre Gasly', number: 10, team: 'Alpine', color: TEAM_COLORS['Alpine'], country: 'FRA',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png"
  },
  { 
    id: 'colapinto', name: 'Franco Colapinto', number: 43, team: 'Alpine', color: TEAM_COLORS['Alpine'], country: 'ARG',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png"
  },
  { 
    id: 'perez', name: 'Sergio Pérez', number: 11, team: 'Cadillac', color: TEAM_COLORS['Cadillac'], country: 'MEX',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png"
  },
  { 
    id: 'bottas', name: 'Valtteri Bottas', number: 77, team: 'Cadillac', color: TEAM_COLORS['Cadillac'], country: 'FIN',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png"
  },
  { 
    id: 'albon', name: 'Alex Albon', number: 23, team: 'Williams', color: TEAM_COLORS['Williams'], country: 'THA',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png"
  },
  { 
    id: 'sainz', name: 'Carlos Sainz', number: 55, team: 'Williams', color: TEAM_COLORS['Williams'], country: 'ESP',
    image: "https://media.formula1.com/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png"
  },
];

// Helper para criar datas ISO com fuso horário BRT (-03:00) para 2026
const d = (month: number, day: number, hour: number, minute: number) => {
  const m = month.toString().padStart(2, '0');
  const dd = day.toString().padStart(2, '0');
  const hh = hour.toString().padStart(2, '0');
  const mm = minute.toString().padStart(2, '0');
  return `2026-${m}-${dd}T${hh}:${mm}:00-03:00`;
};

export const INITIAL_CALENDAR: RaceGP[] = [
  { 
    id: 1, name: 'Austrália', location: 'Melbourne', date: '05-08 Mar', isSprint: false, status: 'OPEN', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(3, 5, 22, 30),
      "TL2": d(3, 6, 2, 0),
      "TL3": d(3, 6, 22, 30),
      "Qualificação": d(3, 7, 2, 0),
      "Corrida": d(3, 8, 1, 0)
    }
  },
  { 
    id: 2, name: 'China', location: 'Xangai', date: '13-15 Mar', isSprint: true, status: 'UPCOMING', 
    sessionStatus: { 'Qualy Sprint': true, 'corrida Sprint': true, 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(3, 13, 0, 30),
      "Qualy Sprint": d(3, 13, 4, 30),
      "Sprint": d(3, 14, 0, 0),
      "Qualificação": d(3, 14, 4, 0),
      "Corrida": d(3, 15, 4, 0)
    }
  },
  { 
    id: 3, name: 'Japão', location: 'Suzuka', date: '26-29 Mar', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(3, 26, 23, 30),
      "TL2": d(3, 27, 3, 0),
      "TL3": d(3, 27, 23, 30),
      "Qualificação": d(3, 28, 3, 0),
      "Corrida": d(3, 29, 2, 0)
    }
  },
  { 
    id: 4, name: 'Bahrein', location: 'Sakhir', date: '10-12 Abr', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(4, 10, 8, 30),
      "TL2": d(4, 10, 12, 0),
      "TL3": d(4, 11, 9, 30),
      "Qualificação": d(4, 11, 13, 0),
      "Corrida": d(4, 12, 12, 0)
    }
  },
  { 
    id: 5, name: 'Arábia Saudita', location: 'Jeddah', date: '17-19 Abr', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(4, 17, 10, 30),
      "TL2": d(4, 17, 14, 0),
      "TL3": d(4, 18, 10, 30),
      "Qualificação": d(4, 18, 14, 0),
      "Corrida": d(4, 19, 14, 0)
    }
  },
  { 
    id: 6, name: 'Miami', location: 'USA', date: '01-03 Mai', isSprint: true, status: 'UPCOMING', 
    sessionStatus: { 'Qualy Sprint': true, 'corrida Sprint': true, 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(5, 1, 13, 30),
      "Qualy Sprint": d(5, 1, 17, 30),
      "Sprint": d(5, 2, 13, 0),
      "Qualificação": d(5, 2, 17, 0),
      "Corrida": d(5, 3, 17, 0)
    }
  },
  { 
    id: 7, name: 'Canadá', location: 'Montreal', date: '22-24 Mai', isSprint: true, status: 'UPCOMING', 
    sessionStatus: { 'Qualy Sprint': true, 'corrida Sprint': true, 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(5, 22, 13, 30),
      "Qualy Sprint": d(5, 22, 17, 30),
      "Sprint": d(5, 23, 13, 0),
      "Qualificação": d(5, 23, 17, 0),
      "Corrida": d(5, 24, 17, 0)
    }
  },
  { 
    id: 8, name: 'Mônaco', location: 'Monte Carlo', date: '05-07 Jun', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(6, 5, 8, 30),
      "TL2": d(6, 5, 12, 0),
      "TL3": d(6, 6, 7, 30),
      "Qualificação": d(6, 6, 11, 0),
      "Corrida": d(6, 7, 10, 0)
    }
  },
  { 
    id: 9, name: 'Espanha', location: 'Barcelona', date: '12-14 Jun', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(6, 12, 8, 30),
      "TL2": d(6, 12, 12, 0),
      "TL3": d(6, 13, 7, 30),
      "Qualificação": d(6, 13, 11, 0),
      "Corrida": d(6, 14, 10, 0)
    }
  },
  { 
    id: 10, name: 'Áustria', location: 'Spielberg', date: '26-28 Jun', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(6, 26, 8, 30),
      "TL2": d(6, 26, 12, 0),
      "TL3": d(6, 27, 7, 30),
      "Qualificação": d(6, 27, 11, 0),
      "Corrida": d(6, 28, 10, 0)
    }
  },
  { 
    id: 11, name: 'Grã-Bretanha', location: 'Silverstone', date: '03-05 Jul', isSprint: true, status: 'UPCOMING', 
    sessionStatus: { 'Qualy Sprint': true, 'corrida Sprint': true, 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(7, 3, 8, 30),
      "Qualy Sprint": d(7, 3, 12, 30),
      "Sprint": d(7, 4, 8, 0),
      "Qualificação": d(7, 4, 12, 0),
      "Corrida": d(7, 5, 11, 0)
    }
  },
  { 
    id: 12, name: 'Bélgica', location: 'Spa', date: '17-19 Jul', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(7, 17, 8, 30),
      "TL2": d(7, 17, 12, 0),
      "TL3": d(7, 18, 7, 30),
      "Qualificação": d(7, 18, 11, 0),
      "Corrida": d(7, 19, 10, 0)
    }
  },
  { 
    id: 13, name: 'Hungria', location: 'Budapest', date: '24-26 Jul', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(7, 24, 8, 30),
      "TL2": d(7, 24, 12, 0),
      "TL3": d(7, 25, 7, 30),
      "Qualificação": d(7, 25, 11, 0),
      "Corrida": d(7, 26, 10, 0)
    }
  },
  { 
    id: 14, name: 'Holanda', location: 'Zandvoort', date: '21-23 Ago', isSprint: true, status: 'UPCOMING', 
    sessionStatus: { 'Qualy Sprint': true, 'corrida Sprint': true, 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(8, 21, 7, 30),
      "Qualy Sprint": d(8, 21, 11, 30),
      "Sprint": d(8, 22, 7, 0),
      "Qualificação": d(8, 22, 11, 0),
      "Corrida": d(8, 23, 10, 0)
    }
  },
  { 
    id: 15, name: 'Itália', location: 'Monza', date: '04-06 Set', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(9, 4, 7, 30),
      "TL2": d(9, 4, 11, 0),
      "TL3": d(9, 5, 7, 30),
      "Qualificação": d(9, 5, 11, 0),
      "Corrida": d(9, 6, 10, 0)
    }
  },
  { 
    id: 16, name: 'Madri', location: 'Espanha', date: '11-13 Set', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(9, 11, 8, 30),
      "TL2": d(9, 11, 12, 0),
      "TL3": d(9, 12, 7, 30),
      "Qualificação": d(9, 12, 11, 0),
      "Corrida": d(9, 13, 10, 0)
    }
  },
  { 
    id: 17, name: 'Azerbaijão', location: 'Baku', date: '24-26 Set', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(9, 24, 5, 30),
      "TL2": d(9, 24, 9, 0),
      "TL3": d(9, 25, 5, 30),
      "Qualificação": d(9, 25, 9, 0),
      "Corrida": d(9, 26, 8, 0)
    }
  },
  { 
    id: 18, name: 'Singapura', location: 'Marina Bay', date: '09-11 Out', isSprint: true, status: 'UPCOMING', 
    sessionStatus: { 'Qualy Sprint': true, 'corrida Sprint': true, 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(10, 9, 6, 30),
      "Qualy Sprint": d(10, 9, 9, 30),
      "Sprint": d(10, 10, 6, 0),
      "Qualificação": d(10, 10, 10, 0),
      "Corrida": d(10, 11, 9, 0)
    }
  },
  { 
    id: 19, name: 'EUA', location: 'Austin', date: '23-25 Out', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(10, 23, 14, 30),
      "TL2": d(10, 23, 18, 0),
      "TL3": d(10, 24, 14, 30),
      "Qualificação": d(10, 24, 18, 0),
      "Corrida": d(10, 25, 17, 0)
    }
  },
  { 
    id: 20, name: 'México', location: 'Mexico City', date: '30 Out-01 Nov', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(10, 30, 15, 30),
      "TL2": d(10, 30, 19, 0),
      "TL3": d(10, 31, 14, 30),
      "Qualificação": d(10, 31, 18, 0),
      "Corrida": d(11, 1, 17, 0)
    }
  },
  { 
    id: 21, name: 'São Paulo', location: 'Interlagos', date: '06-08 Nov', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(11, 6, 12, 30),
      "TL2": d(11, 6, 16, 0),
      "TL3": d(11, 7, 11, 30),
      "Qualificação": d(11, 7, 15, 0),
      "Corrida": d(11, 8, 14, 0)
    }
  },
  { 
    id: 22, name: 'Las Vegas', location: 'Nevada', date: '19-22 Nov', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(11, 19, 21, 30),
      "TL2": d(11, 20, 1, 0),
      "TL3": d(11, 20, 21, 30),
      "Qualificação": d(11, 21, 1, 0),
      "Corrida": d(11, 22, 1, 0)
    }
  },
  { 
    id: 23, name: 'Catar', location: 'Lusail', date: '27-29 Nov', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(11, 27, 10, 30),
      "TL2": d(11, 27, 14, 0),
      "TL3": d(11, 28, 11, 30),
      "Qualificação": d(11, 28, 15, 0),
      "Corrida": d(11, 29, 13, 0)
    }
  },
  { 
    id: 24, name: 'Abu Dhabi', location: 'Yas Marina', date: '04-06 Dez', isSprint: false, status: 'UPCOMING', 
    sessionStatus: { 'Qualy corrida': true, 'corrida principal': true },
    sessions: {
      "TL1": d(12, 4, 6, 30),
      "TL2": d(12, 4, 10, 0),
      "TL3": d(12, 5, 7, 30),
      "Qualificação": d(12, 5, 11, 0),
      "Corrida": d(12, 6, 10, 0)
    }
  },
];
