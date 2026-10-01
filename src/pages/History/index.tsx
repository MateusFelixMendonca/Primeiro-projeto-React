import { useEffect, useState, useMemo } from 'react';
import { TrashIcon } from 'lucide-react';
import { Container } from '../../components/Container';
import { DefaultButton } from '../../components/DefaultButton';
import { Heading } from '../../components/Heading';
import { MainTemplate } from '../../templates/MainTemplate';
import styles from './styles.module.css';
import { useTaskContext } from '../../contexts/TaskContext/useTaskContext';
import { formatDate } from '../../utils/formatDate';
import { getTaskStatus } from '../../utils/getTaskStatus';
import { sortTasks, SortTasksOptions } from '../../utils/sortTasks';
import { showMessage } from '../../adapters/showMessage';
import { TaskActionTypes } from '../../contexts/TaskContext/taskActions';

// Certifique-se de importar o tipo correto do seu arquivo de Actions


export function History() {
  const { state, dispatch } = useTaskContext();
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  
  // Controla apenas os critérios de ordenação no estado
  const [sortConfig, setSortConfig] = useState<{
    field: SortTasksOptions['field'];
    direction: SortTasksOptions['direction'];
  }>({
    field: 'startDate',
    direction: 'desc',
  });

  const hasTasks = state.tasks.length > 0;

  // Otimização: Recomputa a lista apenas quando as tarefas ou a ordenação mudarem
  const sortedTasks = useMemo(() => {
    return sortTasks({
      tasks: [...state.tasks], // Cópia superficial para evitar mutação do estado global
      field: sortConfig.field,
      direction: sortConfig.direction,
    });
  }, [state.tasks, sortConfig]);

  useEffect(() => {
    document.title = 'Histórico - Chronos Pomodoro';
  }, []);

  // Efeito para escutar a confirmação do modal e limpar o histórico
  useEffect(() => {
    if (!confirmClearHistory) return;

    dispatch({ type: TaskActionTypes.RESET_STATE });
    setConfirmClearHistory(false);
  }, [confirmClearHistory, dispatch]);

  // Limpa notificações ao desmontar o componente
  useEffect(() => {
    return () => {
      showMessage.dismiss();
    };
  }, []);

  function handleSortTasks({ field }: Pick<SortTasksOptions, 'field'>) {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }

  function handleResetHistory() {
    showMessage.dismiss();
    showMessage.confirm('Tem certeza?', (confirmation) => {
      setConfirmClearHistory(confirmation);
    });
  }

  return (
    <MainTemplate>
      <Container>
        <Heading>
          <span>History</span>
          {hasTasks && (
            <span className={styles.buttonContainer}>
              <DefaultButton
                icon={<TrashIcon />}
                color="red"
                aria-label="Apagar todo o histórico"
                title="Apagar histórico"
                onClick={handleResetHistory}
              />
            </span>
          )}
        </Heading>
      </Container>
      
      <Container>
        {hasTasks ? (
          <div className={styles.responsiveTable}>
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSortTasks({ field: 'name' })} className={styles.thSort}>
                    Tarefa {sortConfig.field === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleSortTasks({ field: 'duration' })} className={styles.thSort}>
                    Duração {sortConfig.field === 'duration' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th onClick={() => handleSortTasks({ field: 'startDate' })} className={styles.thSort}>
                    Data {sortConfig.field === 'startDate' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </th>
                  <th>Status</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {sortedTasks.map((task) => {
                  const taskTypeDictionary = {
                    workTime: 'Foco',
                    shortBreakTime: 'Descanso curto',
                    longBreakTime: 'Descanso longo',
                  };
                  return (
                    <tr key={task.id}>
                      <td>{task.name}</td>
                      <td>{task.duration}min</td>
                      <td>{formatDate(task.startDate)}</td>
                      <td>{getTaskStatus(task, state.activeTask)}</td>
                      <td>{taskTypeDictionary[task.type as keyof typeof taskTypeDictionary]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
            Ainda não existem tarefas criadas.
          </p>
        )}
      </Container>
    </MainTemplate>
  );
}
