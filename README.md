# Sistema de Gerenciamento de Comandas para Restaurantes
Olá! Sou o Guilherme Pottratz, tenho 17 anos, sou um estudante que esta aprendendo sobre programação. Este projeto é um Sistema de Gerenciamento de Comandas, desenvolvido para otimizar as operações internas de restaurantes, desde o pedido até o faturamento e controle dos produtos. Em um ambiente de restaurante, permitir com que as comandas possam ser gerenciadas com facilidade e rapidez, é essencial para dar mais controle e seguransa aos estabelecimentos. Esse projeto ainda esta em fase de desenvolvimento.

## Funcionalidades Principais
* "/": Autentica usuario atravez do login com suas credencias(usuario e senha), ou atravez do cadastro de um estabelecimento.
* "/index": Possibilita o estabelecimento ver e gerenciar suas comandas, alterar seus produtos, alem de exibir dados financeiros sobre as vendas de seus produtos.
* "/alterar": Permite o estabelecimento gerenciar todos os seus produtos, podendo realizar operasoes como criar, deletar, e atualizar produtos.
* "/cardapio": Nessa parte do sistema, os clientes podem consultar o cardapio de um estabelecimento.

## Tecnologias Utilizadas
Este projeto foi desenvolvido utilizando:
* Linguagens: Node.js
* Linguagens de marcação: Html, Css, Javascript
* Frameworks: Express.js
* Banco de dados: MongoDB
* Ferramentas importantes: Mongoose, Crypto, Https, Cors, Path, Jwt, CookieParser, Tailwind.

## Como rodar o projeto
*Clone o projeto: git clone https://github.com/Guipo1/Sistema-de-gerenciamento-de-comandas.git
*Acesse a pasta "comandas": cd comandas
*Instale todas as dependencias necessarias: npm install
*Rode o comando para inicializar o servidor: npm run start
É precisso se atentar ao fato de que o servidor utiliza o protocolo https, porem por segurança, ele não esta aqui no github. Para executar o servidor normalmente é necesario criar uma pasta chamada "cert", nela devera conter o arquivo "server.crt" e outro arquivo chamado "server.key"
*Outro aviso importante é que as credencias para cadastro no banco de dados tambem nao foram fornecidas por motivos de segurança, por isso lembre-se tambem de criar um arquivo na pasta comandas chamado ".env", nele você deve criar as duas variaveis para salvar suas credencias, são elas: "DB_USUARIO" e "DB_SENHA"
