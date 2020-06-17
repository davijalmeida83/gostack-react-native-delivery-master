import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  category: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const { reset } = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const idFoodSelected = routeParams.id;

      const response = await api.get(`foods/${idFoodSelected}`);

      const foodsFormatted = {
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      };

      const extrasItens = foodsFormatted.extras.map((extra: Extra) => ({
        ...extra,
        quantity: 0,
      })) as Extra[];

      setExtras(extrasItens);
      setFood(foodsFormatted);
    }

    loadFood();
  }, [routeParams, food.price]);

  const handleIncrementExtra = useCallback(
    async id => {
      // Increment extra quantity
      const extraIncremented = extras.map(item => {
        if (item.id === id) {
          Object.assign(item).quantity += 1;
        }
        return item;
      });
      setExtras(extraIncremented);
    },
    [extras],
  );

  const handleDecrementExtra = useCallback(
    async id => {
      // Increment extra quantity
      const extraDecremented = extras.map(item => {
        if (item.id === id && item.quantity > 0) {
          Object.assign(item).quantity -= 1;
        }
        return item;
      });
      setExtras(extraDecremented);
    },
    [extras],
  );

  const handleIncrementFood = useCallback(() => {
    const newQuantityFood = foodQuantity + 1;
    setFoodQuantity(newQuantityFood);
  }, [foodQuantity]);

  const handleDecrementFood = useCallback(() => {
    if (foodQuantity > 1) {
      const newQuantityFood = foodQuantity - 1;
      setFoodQuantity(newQuantityFood);
    }
  }, [foodQuantity]);

  const toggleFavorite = useCallback(() => {
    // Toggle if food is favorite or not
    api.post('favorites', food);

    navigation.navigate('Favorites');

    reset({
      routes: [
        {
          name: 'Favorites',
        },
      ],
      index: 2,
    });
  }, [food, reset, navigation]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const sumExtras = extras.reduce(
      (total, { value, quantity }) => total + value * quantity,
      0,
    );
    const totalOrder = sumExtras + food.price * foodQuantity;
    return formatValue(totalOrder);
  }, [extras, food, foodQuantity]);

  // Finish the order and save on the )API
  const handleFinishOrder = useCallback(async (): Promise<void> => {
    const objExtras = extras.filter(item => item.quantity > 0, []);

    const objFood = {
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      thumbnail_url: food.thumbnail_url,
      extras: objExtras,
    };

    await api.post('orders', objFood);

    navigation.navigate('Orders');

    reset({
      routes: [
        {
          name: 'Orders',
        },
      ],
      index: 1,
    });
  }, [food, reset, extras, navigation]);

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
