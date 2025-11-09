CREATE TABLE "edit_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"headshot_id" text NOT NULL,
	"edit_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "headshot_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"uploaded_photos" json,
	"photo_count" integer NOT NULL,
	"plan" text NOT NULL,
	"style_templates" json,
	"backgrounds" json,
	"outfits" json,
	"generated_headshots" json,
	"headshot_count" integer DEFAULT 0,
	"headshots_by_template" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"processing_time_minutes" integer,
	"amount_paid" integer NOT NULL,
	"stripe_payment_id" text
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"code" varchar(12) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"first_name" text NOT NULL,
	"last_name" text DEFAULT '',
	"profile_image_url" text,
	"stripe_customer_id" text,
	"auth_provider" text DEFAULT 'email' NOT NULL,
	"firebase_uid" text,
	"uploads_used" integer DEFAULT 0 NOT NULL,
	"batches_created" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_batch_id_headshot_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."headshot_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "headshot_batches" ADD CONSTRAINT "headshot_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;