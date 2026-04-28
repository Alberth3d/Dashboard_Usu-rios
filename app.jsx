const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbzmu1ZUcDi9Pemo073ee7R_gwEvhYmxi8HqasuGzvR945KGbNviBJS6FoGKrAaMOStz/exec";

const icons = {
  pessoa: "👤",
  idade: "🎂",
  horario: "🕒",
  corpo: "💢",
  saude: "🩺",
  numero: "📱",
  grafico: "📊",
};

function normalizeHeader(header) {
  return String(header)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function getValue(row, columnName) {
  const foundKey = Object.keys(row).find(
    (key) => normalizeHeader(key) === columnName
  );

  return foundKey ? row[foundKey] : "";
}

function normalizeParticipant(row, index) {
  return {
    id: index + 1,
    nome: getValue(row, "NOME") || "Sem nome",
    idade: getValue(row, "IDADE") || "Nao informado",
    numero: getValue(row, "NUMERO") || "Nao informado",
    horario: getValue(row, "HORARIO") || "Nao informado",

    parteCorpo:
      getValue(row, "PARTECORPO") ||
      getValue(row, "DOR") ||
      "Nao informado",

    condicoesSaude:
      getValue(row, "CONDICOESSAUDE") ||
      getValue(row, "DOENCAS") ||
      getValue(row, "LIMITACOES") ||
      "Nao informado",
  };
}

function getRowsFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.participantes)) return data.participantes;
  if (Array.isArray(data?.value)) return data.value;
  return [];
}

function getInitials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatAge(age) {
  if (!age || age === "Nao informado") {
    return "Nao informado";
  }

  return `${age} anos`;
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function simplifyHorario(value) {
  const text = normalizeText(value);

  if (!text || text.includes("nao informado")) return "Nao informado";
  if (text.includes("manha")) return "Manha";
  if (text.includes("tarde")) return "Tarde";
  if (text.includes("noite")) return "Noite";

  return String(value || "Nao informado");
}

function simplifyParteCorpo(value) {
  const text = normalizeText(value);

  if (!text || text.includes("nao informado")) return "Nao informado";
  if (text.includes("pescoco")) return "Pescoco";
  if (text.includes("ombro")) return "Ombros";
  if (text.includes("costa")) return "Costas";
  if (text.includes("lombar")) return "Lombar";
  if (text.includes("joelho")) return "Joelhos";
  if (text.includes("perna")) return "Pernas";
  if (text.includes("braco")) return "Bracos";
  if (text.includes("quadril")) return "Quadril";

  return String(value || "Nao informado");
}

function countBy(items, selector) {
  const counts = {};

  items.forEach((item) => {
    const key = selector(item);

    if (!key || key === "Nao informado") return;

    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function DetailCard({ icon, label, value }) {
  return (
    <div className="detail-card">
      <div className="detail-card-header">
        <span className="detail-icon">{icon}</span>
        <h3>{label}</h3>
      </div>
      <p>{value}</p>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function BarChart({ title, data, emptyText }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-icon">{icons.grafico}</span>
        <h3>{title}</h3>
      </div>

      {data.length === 0 ? (
        <p className="empty-chart">{emptyText}</p>
      ) : (
        <div className="bar-list">
          {data.map((item) => {
            const width = `${(item.value / maxValue) * 100}%`;

            return (
              <div className="bar-item" key={item.label}>
                <div className="bar-row">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>

                <div className="bar-track">
                  <div className="bar-fill" style={{ width }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function App() {
  const [participants, setParticipants] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    async function loadParticipants() {
      try {
        const response = await fetch(SHEET_URL);

        if (!response.ok) {
          throw new Error("A planilha nao respondeu corretamente.");
        }

        const data = await response.json();
        const rows = getRowsFromResponse(data);
        const normalizedParticipants = rows.map(normalizeParticipant);

        setParticipants(normalizedParticipants);
        setSelectedId(normalizedParticipants[0]?.id ?? null);
      } catch (error) {
        setErrorMessage(
          "Nao foi possivel carregar os participantes. Tente novamente em alguns instantes."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadParticipants();
  }, []);

  const selectedParticipant = participants.find(
    (participant) => participant.id === selectedId
  );

  const horariosChart = countBy(participants, (participant) =>
    simplifyHorario(participant.horario)
  );

  const doresChart = countBy(participants, (participant) =>
    simplifyParteCorpo(participant.parteCorpo)
  );

  const detailItems = selectedParticipant
    ? [
        {
          icon: icons.idade,
          label: "Idade",
          value: formatAge(selectedParticipant.idade),
        },
        {
          icon: icons.numero,
          label: "Numero",
          value: selectedParticipant.numero,
        },
        {
          icon: icons.horario,
          label: "Horario preferido",
          value: selectedParticipant.horario,
        },
        {
          icon: icons.corpo,
          label: "Parte do corpo",
          value: selectedParticipant.parteCorpo,
        },
        {
          icon: icons.saude,
          label: "Condicao de saude",
          value: selectedParticipant.condicoesSaude,
        },
      ]
    : [];

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">BETO Dashboard</p>
          <h1>Participantes</h1>
          <p>Dados coletados pelo WhatsApp e salvos no Google Sheets.</p>
        </div>

        <div className="header-badge">Alongamentos + Saude</div>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Participantes"
          value={participants.length}
          helper="Total carregado da planilha"
        />

        <StatCard
          label="Horario mais comum"
          value={horariosChart[0]?.label || "-"}
          helper="Preferencia predominante"
        />

        <StatCard
          label="Dor mais comum"
          value={doresChart[0]?.label || "-"}
          helper="Regiao mais citada"
        />
      </section>

      <section className="charts-grid">
        <BarChart
          title="Horarios preferidos"
          data={horariosChart}
          emptyText="Ainda nao ha horarios suficientes para gerar o grafico."
        />

        <BarChart
          title="Partes do corpo mais citadas"
          data={doresChart}
          emptyText="Ainda nao ha regioes do corpo suficientes para gerar o grafico."
        />
      </section>

      <section className="dashboard">
        <aside className="panel sidebar-panel">
          <div className="panel-header">
            <h2>Lista de participantes</h2>
            <p>Clique em um nome para ver os detalhes.</p>
          </div>

          <div className="participant-list">
            {isLoading && (
              <p className="empty-state">Carregando participantes...</p>
            )}

            {!isLoading && errorMessage && (
              <p className="empty-state">{errorMessage}</p>
            )}

            {!isLoading &&
              !errorMessage &&
              participants.map((participant) => (
                <button
                  key={participant.id}
                  className={
                    participant.id === selectedId
                      ? "participant-button active"
                      : "participant-button"
                  }
                  onClick={() => setSelectedId(participant.id)}
                >
                  <div className="participant-row">
                    <div className="participant-avatar">
                      {getInitials(participant.nome)}
                    </div>

                    <div className="participant-text">
                      <strong>{participant.nome}</strong>
                      <span>{formatAge(participant.idade)}</span>
                      <span>Horario: {participant.horario}</span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </aside>

        <section className="panel details-panel">
          <div className="panel-header">
            <h2>Detalhes do participante</h2>
            <p>Resumo individual da anamnese.</p>
          </div>

          <div className="details-content">
            {isLoading && (
              <p className="empty-state">Carregando participantes...</p>
            )}

            {!isLoading && errorMessage && (
              <p className="empty-state">{errorMessage}</p>
            )}

            {!isLoading && !errorMessage && selectedParticipant ? (
              <>
                <div className="details-hero">
                  <div className="details-hero-text">
                    <div className="details-avatar">
                      {getInitials(selectedParticipant.nome)}
                    </div>

                    <div>
                      <p className="details-label">Participante selecionado</p>
                      <h3 className="details-name">
                        {selectedParticipant.nome}
                      </h3>
                      <p className="details-summary">
                        Visualizacao rapida dos dados coletados na anamnese.
                      </p>
                    </div>
                  </div>

                  <div className="details-illustration">
                    <div className="shape shape-one"></div>
                    <div className="shape shape-two"></div>
                    <div className="shape shape-three"></div>
                  </div>
                </div>

                <div className="details-grid">
                  {detailItems.map((item) => (
                    <DetailCard
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </div>
              </>
            ) : (
              !isLoading &&
              !errorMessage && (
                <p className="empty-state">
                  Nenhum participante encontrado na planilha.
                </p>
              )
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);