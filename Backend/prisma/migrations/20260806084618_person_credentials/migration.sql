-- CreateTable
CREATE TABLE "person_credentials" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "person_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_credentials_person_id_key" ON "person_credentials"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_credentials_email_key" ON "person_credentials"("email");

-- AddForeignKey
ALTER TABLE "person_credentials" ADD CONSTRAINT "person_credentials_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
