const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbzmu1ZUcDi9Pemo073ee7R_gwEvhYmxi8HqasuGzvR945KGbNviBJS6FoGKrAaMOStz/exec";

const icons = {
  pessoa: "\u{1F464}",
  idade: "\u{1F382}",
  percepcao: "\u2600",
  horario: "\u{1F552}",
  dor: "\u{1F4A2}",
  equilibrio: "\u{1F9CD}",
  doencas: "\u{1FA7A}",
  limitacoes: "\u26A0",
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
    numero: getValue(row, "NUMERO") || "",
    percepcao: getValue(row, "PERCEPCAO") || "Nao informado",
    horario: getValue(row, "HORARIO") || "Nao informado",
    dor: getValue(row, "DOR") || "Nao informado",
    equilibrio: getValue(row, "EQUILIBRIO") || "Nao informado",
    doencas: getValue(row, "DOENCAS") || "Nao informado",
    limitacoes: getValue(row, "LIMITACOES") || "Nao informado",
  };
}

function getRowsFromResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.dados)) {
    return data.dados;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.participantes)) {
    return data.participantes;
  }

  if (Array.isArray(data?.value)) {
    return data.value;
  }

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

function DetailCard({ icon, label, value }) {
  return (
    <div className="detail-card">
      <div className="detail-card-header">
        <span className="detail-icon" aria-hidden="true">
          {icon}
        </span>
        <h3>{label}</h3>
      </div>
      <p>{value}</p>
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

  const detailItems = selectedParticipant
    ? [
        {
          icon: icons.idade,
          label: "Idade",
          value: `${selectedParticipant.idade} anos`,
        },
        {
          icon: icons.percepcao,
          label: "Percepcao",
          value: selectedParticipant.percepcao,
        },
        {
          icon: icons.horario,
          label: "Horario",
          value: selectedParticipant.horario,
        },
        { icon: icons.dor, label: "Dor", value: selectedParticipant.dor },
        {
          icon: icons.equilibrio,
          label: "Equilibrio",
          value: selectedParticipant.equilibrio,
        },
        {
          icon: icons.doencas,
          label: "Doencas",
          value: selectedParticipant.doencas,
        },
        {
          icon: icons.limitacoes,
          label: "Limitacoes",
          value: selectedParticipant.limitacoes,
        },
      ]
    : [];

  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Dashboard React</p>
        <h1>Participantes</h1>
        <p>Lista carregada do Google Sheets, sem backend proprio.</p>
      </header>

      <section className="dashboard">
        <aside className="panel">
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
                      <span>{participant.idade} anos</span>
                      <span>Horario: {participant.horario}</span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header">
            <h2>Detalhes do participante</h2>
            <p>Dados do participante selecionado.</p>
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
                      <h3 className="details-name">{selectedParticipant.nome}</h3>
                      <p className="details-summary">
                        Visualizacao rapida com dados reais da planilha.
                      </p>
                    </div>
                  </div>

                  <div className="details-illustration" aria-hidden="true">
                    <div className="shape shape-one"></div>
                    <div className="shape shape-two"></div>
                    <div className="shape shape-three"></div>
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-card detail-card-name">
                    <div className="detail-card-header">
                      <span className="detail-icon" aria-hidden="true">
                        {icons.pessoa}
                      </span>
                      <h3>Nome</h3>
                    </div>
                    <p>{selectedParticipant.nome}</p>
                  </div>

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
            ) : null}

            {!isLoading && !errorMessage && !selectedParticipant && (
              <p className="empty-state">Nenhum participante encontrado.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
