import { SubscriptionTestingAPI } from 'test/users/apis/application/subscription.testing-api';

describe('UpgradeToPremiumHandler (Clean Test)', () => {
  
  it('debería actualizar la suscripción a Premium y guardar los cambios', async () => {
    const api = new SubscriptionTestingAPI();
    const userId = 'user-123';

    await api
      .givenAFreeUserExists(userId)
      .whenUpgradeToPremiumIsExecuted(userId)
      
      api.thenSubscriptionShouldBePremium();
  });

  it('debería fallar si el usuario no existe', async () => {
    const api = new SubscriptionTestingAPI();
    const userId = 'unknown-user';

    await api
      .givenUserDoesNotExist()
      .whenUpgradeToPremiumIsExecuted(userId)
      
      api.thenItShouldFailWithUserNotFound();
  });
});