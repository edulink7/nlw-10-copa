import { useEffect, useState } from 'react';
import { FlatList, useToast } from 'native-base';

import { api } from '../services/api';

import { Match, MatchProps } from './Match';
import { Loading } from './Loading';

interface Props {
  poolId: string;
}

export function Guesses({ poolId }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<MatchProps[]>([]);
  const [firstTeamPoints, setFirstTeamPoints] = useState('');
  const [secondTeamPoints, setSecondTeamPoints] = useState('');

  const toast = useToast();

  async function fetchMatches(){
    try {
      setIsLoading(true);

      const response = await api.get(`/pools/${poolId}/matches`);
      setMatches(response.data.matches);

    } catch (error) {
      console.log(error);

      toast.show({
        title: 'Não foi posível carregar os jogos.',
        placement: 'top',
        bgColor: 'red.500'
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuessConfirm(matchId: string){
    try {
      if(!firstTeamPoints.trim() || !secondTeamPoints.trim()) {
        return toast.show({
          title: 'Informe o placar palpite.',
          placement: 'top',
          bgColor: 'red.500'
        });
      }

      setIsLoading(true);

      const response = await api.post(`/pools/${poolId}/matches/${matchId}/guesses`, {
        firstTeamPoints: Number(firstTeamPoints),
        secondTeamPoints: Number(secondTeamPoints),
      });

      toast.show({
        title: 'Palpite realizado com sucesso!',
        placement: 'top',
        bgColor: 'green.500'
      });

      fetchMatches();

    } catch (error) {
      console.log(error);

      toast.show({
        title: 'Não foi posível enviar o palpite.',
        placement: 'top',
        bgColor: 'red.500'
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMatches();
  }, [])

  if (isLoading){
    return <Loading />
  }

  return (
    <FlatList 
      data={matches}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Match 
          data={item}
          setFirstTeamPoints={setFirstTeamPoints}
          setSecondTeamPoints={setSecondTeamPoints}
          onGuessConfirm={() => handleGuessConfirm(item.id)}
        />
      )}
    />
  );
}
