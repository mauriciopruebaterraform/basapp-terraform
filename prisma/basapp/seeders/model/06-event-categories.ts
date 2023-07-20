import { Prisma, PrismaClient } from '@prisma/client';
import { eventCategory } from '../utils/constants';
import { Model } from '../seed';

const { ADMINISTRATION, CONSTRUCTION, VISITAS } = eventCategory;

const model: Model & { data: Prisma.EventCategoryCreateManyInput[] } = {
  data: [
    {
      id: ADMINISTRATION,
      title: 'Administración',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/636888fd-f932-4b32-b780-45274fac872e.png',
        name: '636888fd-f932-4b32-b780-45274fac872e.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/636888fd-f932-4b32-b780-45274fac872e-thumbnail.png',
      },
    },
    {
      id: '560016e2-4c4f-4de7-a103-e03ea66d9f61',
      title: 'Animales sueltos',
      active: false,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/7d62ffb5-a4d4-49f2-90f1-62f02b046b8f.png',
        name: '7d62ffb5-a4d4-49f2-90f1-62f02b046b8f.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/7d62ffb5-a4d4-49f2-90f1-62f02b046b8f-thumbnail.png',
      },
    },
    {
      id: '0812ebc7-7ea8-4a2d-b7a4-657ecc526633',
      title: 'Autorización de salidas',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/cd81c2a6-5883-408b-a5d6-02338fd2bef7.png',
        name: 'cd81c2a6-5883-408b-a5d6-02338fd2bef7.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/cd81c2a6-5883-408b-a5d6-02338fd2bef7-thumbnail.png',
      },
    },
    {
      id: '98ad5e8f-76e5-4ad9-9323-aa57f452aea8',
      title: 'Caballos',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/c5196395-c4e6-4875-b56a-77bdadde9f85.png',
        name: 'c5196395-c4e6-4875-b56a-77bdadde9f85.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/c5196395-c4e6-4875-b56a-77bdadde9f85-thumbnail.png',
      },
    },
    {
      id: '323e9b21-8c7f-460c-ae1b-01f1a127a243',
      title: 'Cancha polifuncional',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/9ef68d2d-111c-4aec-8e16-299ed1523779.png',
        name: '9ef68d2d-111c-4aec-8e16-299ed1523779.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/9ef68d2d-111c-4aec-8e16-299ed1523779-thumbnail.png',
      },
    },
    {
      id: 'dfe4b95a-d732-4a89-bf37-51ab72582c7e',
      title: 'Casa club',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/72f37866-c5cf-4957-8953-16b94703b22f.png',
        name: '72f37866-c5cf-4957-8953-16b94703b22f.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/72f37866-c5cf-4957-8953-16b94703b22f-thumbnail.png',
      },
    },
    {
      id: 'a11cd41a-f5b1-4604-b8a3-7b0c8c991825',
      title: 'Club house / SUM',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/ce1aba11-9803-450f-82bd-41bc2becc6d8.png',
        name: 'ce1aba11-9803-450f-82bd-41bc2becc6d8.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/ce1aba11-9803-450f-82bd-41bc2becc6d8-thumbnail.png',
      },
    },
    {
      id: '44277cfa-fbab-49ae-9a05-7f819f2dcbf1',
      title: 'Delivery',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/1f33008b-2243-4ece-aaf2-201324501668.png',
        name: '1f33008b-2243-4ece-aaf2-201324501668.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/1f33008b-2243-4ece-aaf2-201324501668-thumbnail.png',
      },
    },
    {
      id: '994194dd-a7a1-49a1-8d9d-7b8b69d8bea7',
      title: 'Denuncias',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/781045a9-e133-4b4a-8603-6bcd13517ada.png',
        name: '781045a9-e133-4b4a-8603-6bcd13517ada.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/781045a9-e133-4b4a-8603-6bcd13517ada-thumbnail.png',
      },
    },
    {
      id: 'b78e017b-f8ff-4b48-8d5a-6f04b700a9b7',
      title: 'Denuncias / Reclamos',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/872bcb81-ca07-4717-9893-0926b590817b.png',
        name: '872bcb81-ca07-4717-9893-0926b590817b.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/872bcb81-ca07-4717-9893-0926b590817b-thumbnail.png',
      },
    },
    {
      id: '8b7b062c-5d4d-4664-bf90-5aee97c85e16',
      title: 'Farolas quemadas',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/69a0dd16-4980-4fbc-b45c-bdc896582ba0.png',
        name: '69a0dd16-4980-4fbc-b45c-bdc896582ba0.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/69a0dd16-4980-4fbc-b45c-bdc896582ba0-thumbnail.png',
      },
    },
    {
      id: '191586ea-f64f-4432-a22a-b50dc09d616f',
      title: 'Fútbol',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/7cfc7999-ada1-4ba4-9b5b-721511c5c678.png',
        name: '7cfc7999-ada1-4ba4-9b5b-721511c5c678.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/7cfc7999-ada1-4ba4-9b5b-721511c5c678-thumbnail.png',
      },
    },
    {
      id: 'dd6f1f0d-7a37-46b0-bb83-b415105173fd',
      title: 'Gimnasio',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/42be8c09-65e8-4b53-8866-174db95c0a2a.png',
        name: '42be8c09-65e8-4b53-8866-174db95c0a2a.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/42be8c09-65e8-4b53-8866-174db95c0a2a-thumbnail.png',
      },
    },
    {
      id: '7181aa0a-6514-4dd2-b636-580440b342da',
      title: 'Golf',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/cada64d0-c07f-49fe-a7f5-13ebc9fb8edd.png',
        name: 'cada64d0-c07f-49fe-a7f5-13ebc9fb8edd.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/cada64d0-c07f-49fe-a7f5-13ebc9fb8edd-thumbnail.png',
      },
    },
    {
      id: '4284a422-6001-4486-9bf3-4b61c6bc85a6',
      title: 'Hockey',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/cad26bad-af35-4cc8-9e2f-33c7f9696a58.png',
        name: 'cad26bad-af35-4cc8-9e2f-33c7f9696a58.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/cad26bad-af35-4cc8-9e2f-33c7f9696a58-thumbnail.png',
      },
    },
    {
      id: '3543ce60-ee9f-4456-b1b0-bed50a9f8333',
      title: 'Náutica',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/9a8acd0c-b6ef-41e8-90eb-81f8971791fe.png',
        name: '9a8acd0c-b6ef-41e8-90eb-81f8971791fe.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/9a8acd0c-b6ef-41e8-90eb-81f8971791fe-thumbnail.png',
      },
    },
    {
      id: CONSTRUCTION,
      title: 'Obras',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/c666120a-b26f-4fac-b72a-4098184d5535.png',
        name: 'c666120a-b26f-4fac-b72a-4098184d5535.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/c666120a-b26f-4fac-b72a-4098184d5535-thumbnail.png',
      },
    },
    {
      id: '9af46f0a-9b38-46c7-8df8-7ecace4d02eb',
      title: 'Paddle',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/1f8492a9-3abc-49c1-8f8d-aa8e666711f0.png',
        name: '1f8492a9-3abc-49c1-8f8d-aa8e666711f0.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/1f8492a9-3abc-49c1-8f8d-aa8e666711f0-thumbnail.png',
      },
    },
    {
      id: 'd44472df-981f-4faf-bd27-41d546458c0d',
      title: 'Palapa',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/51ae325d-dba2-4844-b7c0-2ccc43bcc3b9.png',
        name: '51ae325d-dba2-4844-b7c0-2ccc43bcc3b9.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/51ae325d-dba2-4844-b7c0-2ccc43bcc3b9-thumbnail.png',
      },
    },
    {
      id: '1fc285ab-8fee-48ca-8329-ae13a61ea738',
      title: 'Pileta',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/334e515a-eaff-4bc2-9e38-0bb66034ba9e.png',
        name: '334e515a-eaff-4bc2-9e38-0bb66034ba9e.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/334e515a-eaff-4bc2-9e38-0bb66034ba9e-thumbnail.png',
      },
    },
    {
      id: '62410e73-802d-48a0-a590-4463b255271f',
      title: 'Quincho',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/5273b98a-ad15-48ad-a4e4-a138c33423fd.png',
        name: '5273b98a-ad15-48ad-a4e4-a138c33423fd.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/5273b98a-ad15-48ad-a4e4-a138c33423fd-thumbnail.png',
      },
    },
    {
      id: 'c74a8c87-79f2-45d3-9b3e-89e5dd70116e',
      title: 'Remises',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/8b1759ec-84b8-44e2-b0c7-9cb25b1becc6.png',
        name: '8b1759ec-84b8-44e2-b0c7-9cb25b1becc6.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/8b1759ec-84b8-44e2-b0c7-9cb25b1becc6-thumbnail.png',
      },
    },
    {
      id: 'c035147a-dde1-46b1-9414-bea54e2340e4',
      title: 'Retiro de objetos',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d3b6fe14-886a-4e44-86b0-0ed2b3be6b8a.png',
        name: 'd3b6fe14-886a-4e44-86b0-0ed2b3be6b8a.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/d3b6fe14-886a-4e44-86b0-0ed2b3be6b8a-thumbnail.png',
      },
    },
    {
      id: 'addec80d-ec16-4ed8-8238-8e464977027f',
      title: 'Ruidos molestos',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/f02aa17a-5eba-42de-b317-a9e12457a0b8.png',
        name: 'f02aa17a-5eba-42de-b317-a9e12457a0b8.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/f02aa17a-5eba-42de-b317-a9e12457a0b8-thumbnail.png',
      },
    },
    {
      id: 'c3082c67-db3f-466b-9aee-4cbc8d12024c',
      title: 'Salida de menores',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/eb3a2245-84e3-4c25-89f1-06e591a0187a.png',
        name: 'eb3a2245-84e3-4c25-89f1-06e591a0187a.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/eb3a2245-84e3-4c25-89f1-06e591a0187a-thumbnail.png',
      },
    },
    {
      id: 'dafe8c58-5914-45e8-a127-31ea8ecce472',
      title: 'Seguridad',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/29e89ddf-8d89-4874-a835-17f0aaeba247.png',
        name: '29e89ddf-8d89-4874-a835-17f0aaeba247.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/29e89ddf-8d89-4874-a835-17f0aaeba247-thumbnail.png',
      },
    },
    {
      id: '26b607bc-6234-4aa6-9b49-122adb686977',
      title: 'Servicios varios',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/a3f3dc3f-5566-412c-9891-3c798afb6c59.png',
        name: 'a3f3dc3f-5566-412c-9891-3c798afb6c59.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/a3f3dc3f-5566-412c-9891-3c798afb6c59-thumbnail.png',
      },
    },
    {
      id: 'e20c1f4c-4259-44ce-a2c7-5347b3915567',
      title: 'Supermercado',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/3f8f5070-05b8-4af1-b922-cd66b6a908fe.png',
        name: '3f8f5070-05b8-4af1-b922-cd66b6a908fe.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/3f8f5070-05b8-4af1-b922-cd66b6a908fe-thumbnail.png',
      },
    },
    {
      id: 'bd2c5e7d-7353-40c7-a42f-a9da6cdbb68f',
      title: 'Tenis',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/1792ee9b-ed0f-4d7c-a738-c56123056608.png',
        name: '1792ee9b-ed0f-4d7c-a738-c56123056608.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/1792ee9b-ed0f-4d7c-a738-c56123056608-thumbnail.png',
      },
    },
    {
      id: VISITAS,
      title: 'Visitas',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/1cec25a1-9e59-4b9c-8f11-e377c7ad6fac.png',
        name: '1cec25a1-9e59-4b9c-8f11-e377c7ad6fac.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/1cec25a1-9e59-4b9c-8f11-e377c7ad6fac-thumbnail.png',
      },
    },
    {
      id: 'f3a2fd75-c7ec-4b01-9453-3d6333e64dbd',
      title: 'Voley',
      active: true,
      image: {
        url: 'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/03c7bdd7-3f25-4398-937e-c3e1f9b2e546.png',
        name: '03c7bdd7-3f25-4398-937e-c3e1f9b2e546.png',
        thumbnailUrl:
          'https://s3.amazonaws.com/uploads.demo.countries.basapp.com.ar/customer/03c7bdd7-3f25-4398-937e-c3e1f9b2e546-thumbnail.png',
      },
    },
  ],
  async run(prisma: PrismaClient) {
    return prisma.eventCategory.createMany({
      data: this.data,
    });
  },
};
export default model;
