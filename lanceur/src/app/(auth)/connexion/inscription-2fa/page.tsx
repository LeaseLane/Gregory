import { CadreAuth } from '../../CadreAuth';
import { InscriptionFacteur } from './InscriptionFacteur';

export default function Inscription2fa() {
  return (
    <CadreAuth>
      <InscriptionFacteur />
    </CadreAuth>
  );
}
