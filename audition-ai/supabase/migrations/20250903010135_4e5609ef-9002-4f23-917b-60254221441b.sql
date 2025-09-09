-- Create headshot_rulesets table to store evaluation rules
CREATE TABLE public.headshot_rulesets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  enums JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform_specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  rules_global JSONB NOT NULL DEFAULT '{}'::jsonb,
  style_tracks JSONB NOT NULL DEFAULT '{}'::jsonb,
  persona_tracks JSONB NOT NULL DEFAULT '{}'::jsonb,
  checklists JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluation_io JSONB NOT NULL DEFAULT '{}'::jsonb,
  ui_copy_snippets JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.headshot_rulesets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active rulesets" 
ON public.headshot_rulesets 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage rulesets" 
ON public.headshot_rulesets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_headshot_rulesets_updated_at
BEFORE UPDATE ON public.headshot_rulesets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the provided ruleset (version 1.1)
INSERT INTO public.headshot_rulesets (
  version, 
  metadata, 
  enums, 
  platform_specs, 
  rules_global, 
  style_tracks, 
  persona_tracks, 
  checklists, 
  scoring, 
  evaluation_io, 
  ui_copy_snippets
) VALUES (
  '1.1',
  '{
    "version": "1.1",
    "last_updated": "2025-09-02",
    "intended_use": "Headshot evaluator rules for actors (commercial + theatrical TV/film)",
    "tracks": ["commercial", "theatrical"]
  }'::jsonb,
  '{
    "lighting_styles": ["soft_even", "directional_modeled", "high_key", "low_key"],
    "background_styles": ["studio_solid", "subtle_textured", "environmental_shallow"],
    "palettes": {
      "light_neutrals": ["off_white", "stone", "pale_gray", "sand"],
      "mid_neutrals": ["heather_gray", "taupe", "olive_gray"],
      "dark_neutrals": ["charcoal", "navy", "deep_gray", "espresso"],
      "friendly_colors": ["soft_blue", "teal", "sage", "coral", "muted_yellow"],
      "rich_tones": ["burgundy", "forest_green", "ink_blue", "aubergine"]
    }
  }'::jsonb,
  '{
    "print_standard": {
      "size_inches": [8, 10],
      "color_mode": "color_only",
      "dpi_min": 300,
      "name_on_front": true
    },
    "actors_access": {
      "optimal_size_px": [500, 700],
      "slateshot_supported": true,
      "notes": "Upload multiple looks; SlateShots are ~7s personality clips tied to a photo."
    },
    "casting_networks": {
      "file_types": ["jpg", "jpeg", "png", "gif"],
      "max_file_size_mb": 30,
      "min_dimensions_px": [360, 360],
      "notes": "Larger uploads are auto-downscaled."
    }
  }'::jsonb,
  '{
    "technical": {
      "focus": "eyes_tack_sharp",
      "exposure": "skin_tones_correct_no_clipping",
      "white_balance": "neutral_true_to_life",
      "color_space": "sRGB",
      "noise": "low",
      "crop": "eyes_on_upper_third; allow hair crop; avoid chin chop",
      "orientation": "vertical_preferred",
      "duplicates": "avoid_near_duplicates_in_final_selects"
    },
    "background": {
      "style": "simple_slightly_defocused",
      "contrast_goal": "subject_separates_from_background",
      "allowed": ["studio_solid", "subtle_textured", "environmental_shallow"],
      "avoid": ["busy_patterns", "distinct_landmarks", "clutter", "high-contrast_distractors"]
    },
    "retouching": {
      "philosophy": "minimally_corrective_not_transformative",
      "do": [
        "temporary_blemish_cleanup",
        "stray_hair_taming",
        "minor_under_eye_evening",
        "lint_dust_removal",
        "exposure_color_consistency"
      ],
      "dont": [
        "skin_blur_plastic_look",
        "reshape_face_or_body",
        "over_whiten_eyes_or_teeth",
        "heavy_filters_or_color_trends",
        "ai_face_swap_or_age_reduction"
      ]
    },
    "wardrobe_general": {
      "do": [
        "solids_or_subtle_textures",
        "flattering_necklines",
        "tailored_fit",
        "light_layering (jacket/cardigan)",
        "avoid_logos_and_large_graphics"
      ],
      "dont": [
        "high_contrast_stripes_moire_risks",
        "busy_checks",
        "wrinkled_or_high_shine_fabrics",
        "on_the_nose_costumes"
      ]
    },
    "grooming_makeup": {
      "makeup": "camera_ready_natural_finish_reduce_shine_keep_texture",
      "facial_hair": "choose_clean_or_groomed; maintain consistency across submissions",
      "hair": "present_primary_real_world_default; capture alt_if_often_change",
      "glasses": "shoot_with_if_worn_regularly; use_anti_glare"
    },
    "delivery_package": {
      "must_have": [
        "color_corrected_master_full_res",
        "web_ready_export_per_platform",
        "optional_bw_for_marketing_only",
        "clearly_labeled_filenames_or_contact_sheet"
      ],
      "filename_convention": "Lastname_Firstname_LookType_Track_Color_YYYY.ext",
      "embedded_metadata": ["name", "contact_or_rep", "date"]
    }
  }'::jsonb,
  '{
    "commercial": {
      "purpose": "approachability_market_friendly_bookable_everyday",
      "expression_primary": ["warm_smile", "open_eyes", "friendly_energy"],
      "expression_alternates": ["soft_smile", "confident_neutral_with_warmth"],
      "lighting": "soft_even",
      "background_palette": ["light_neutrals", "friendly_colors"],
      "wardrobe_palette": ["friendly_colors", "light_neutrals", "mid_neutrals"],
      "composition": [
        "tight_to_medium_crop",
        "bright_catchlights",
        "limit_heavy_shadows"
      ],
      "dos": [
        "project_trustworthiness_energy",
        "show_personality_without_props",
        "bring_2_3_simple_top_changes"
      ],
      "donts": [
        "overdramatic_pose_or_squint",
        "moody_color_grades",
        "busy_backgrounds_or_logos"
      ]
    },
    "theatrical": {
      "purpose": "story_depth_range_for_tv_film_stage",
      "expression_primary": ["grounded_neutral", "subtle_intensity_in_eyes"],
      "expression_alternates": ["hint_of_edge", "thoughtful_vulnerability"],
      "lighting": "directional_modeled",
      "background_palette": ["mid_neutrals", "dark_neutrals"],
      "wardrobe_palette": ["rich_tones", "dark_neutrals", "mid_neutrals"],
      "composition": [
        "slightly_wider_ok",
        "accept_intentional_shadow_depth",
        "maintain_true_skin_tones"
      ],
      "dos": [
        "micro_expression_variants",
        "castable_types_without_costume",
        "deliver_grounded_and_edgier_option"
      ],
      "donts": [
        "smile_primary_across_all_frames",
        "only_flat_even_light",
        "over_stylized_color_grades"
      ]
    }
  }'::jsonb,
  '{
    "notes": "Use with commercial/theatrical tracks to tune expression, palette, and micro-direction. Do NOT costume; suggest the lane.",
    "personas": [
      {
        "id": "authority_command",
        "label": "Authority / Command (Detective, Judge, Military, Executive)",
        "track_bias": "theatrical",
        "expression": ["calm_neutral", "decisive_micro_tension_in_eyes"],
        "lighting": "directional_modeled",
        "wardrobe_suggestions": ["dark_neutrals", "rich_tones", "structured_layers (blazer, collared top)"],
        "background": ["dark_neutrals", "mid_neutrals"],
        "grooming": "clean_edges; facial_hair_neatly_trimmed",
        "microbeats": ["resolve", "assess", "subtle_concern", "decision"],
        "deliver": ["one_grounded", "one_edge_intensity"]
      },
      {
        "id": "everyday_neighbor",
        "label": "Everyday Neighbor / Best Friend / Parent",
        "track_bias": "commercial",
        "expression": ["warm_smile", "soft_smile", "approachable_neutral"],
        "lighting": "soft_even",
        "wardrobe_suggestions": ["friendly_colors", "light_neutrals", "soft_layers (henley, knit)"],
        "background": ["light_neutrals", "friendly_colors"],
        "grooming": "natural; minimal retouch",
        "microbeats": ["welcome", "listen", "encourage"],
        "deliver": ["two_subtle_smile_variants", "one_neutral_with_warmth"]
      },
      {
        "id": "credible_pro",
        "label": "Doctor / Lawyer / Tech Lead / Educator",
        "track_bias": "theatrical",
        "expression": ["smart_neutral", "reassuring_confidence"],
        "lighting": "directional_modeled (soft key, gentle fill)",
        "wardrobe_suggestions": ["mid_neutrals", "rich_tones", "clean_lines"],
        "background": ["mid_neutrals"],
        "grooming": "polished_not_flashy",
        "microbeats": ["explain", "consider", "resolve"],
        "deliver": ["neutral_confident", "hint_smile_reassurance"]
      },
      {
        "id": "antagonist_edge",
        "label": "Antagonist / Complicated Villain / Noir Edge",
        "track_bias": "theatrical",
        "expression": ["contained_intensity", "micro_smirk", "stoic"],
        "lighting": "directional_modeled or low_key",
        "wardrobe_suggestions": ["dark_neutrals", "ink_blue", "textured_layers"],
        "background": ["dark_neutrals"],
        "grooming": "intentional_edges; keep texture",
        "microbeats": ["withhold", "challenge", "threaten (subtle)"],
        "deliver": ["one_low_key", "one_directional_modeled"]
      },
      {
        "id": "comedic_dad_buddy",
        "label": "Comedic Dad / Buddy / Boss-With-A-Heart",
        "track_bias": "commercial",
        "expression": ["bright_smile", "amused_neutral", "eyebrow_pop"],
        "lighting": "soft_even or high_key",
        "wardrobe_suggestions": ["friendly_colors", "mid_neutrals", "casual_layers"],
        "background": ["light_neutrals", "friendly_colors"],
        "grooming": "tidy; allow laugh_lines",
        "microbeats": ["pitch_a_joke (subtle)", "oops", "reassure"],
        "deliver": ["two_smile_levels", "one_neutral_amused"]
      },
      {
        "id": "blue_collar_grit",
        "label": "Blue-Collar Grit / First Responder / Ranch Hand",
        "track_bias": "theatrical",
        "expression": ["stoic_resolve", "soft_earnest"],
        "lighting": "directional_modeled (more texture)",
        "wardrobe_suggestions": ["mid_neutrals", "rich_tones (forest, ink)", "sturdy_textures (no logos)"],
        "background": ["mid_neutrals", "dark_neutrals"],
        "grooming": "natural_texture; avoid glossy finish",
        "microbeats": ["shoulder_the_load", "quiet_compassion"],
        "deliver": ["grounded_neutral", "vulnerable_subtle"]
      },
      {
        "id": "western_classic",
        "label": "Western Classic / Frontier Authority (modern-adjacent)",
        "track_bias": "theatrical",
        "expression": ["steady_gaze", "measured_neutral"],
        "lighting": "directional_modeled (sun-kissed feel acceptable without heavy grade)",
        "wardrobe_suggestions": ["dark_neutrals", "rich_tones", "subtle_rugged_texture (no overt costume)"],
        "background": ["mid_neutrals", "environmental_shallow (wood/earth tones)"],
        "grooming": "trimmed_facial_hair_ok; keep authenticity",
        "microbeats": ["watchful", "resolve", "protect"],
        "deliver": ["one_grounded", "one_edge_intensity"]
      }
    ]
  }'::jsonb,
  '{
    "session_prep": [
      "confirm_target_roles_and_types_with_rep",
      "wardrobe_pull_by_palette (commercial vs theatrical)",
      "haircut_trim_5_7_days_prior",
      "sleep_hydrate_reduce_alcohol_day_before",
      "bring_blotting_papers_lip_balm"
    ],
    "shoot_day": [
      "test_shot_check_eyes_focus_catchlights",
      "rotate_tops_every_15_20_minutes",
      "review_on_set_for_focus_expression",
      "capture_with_glasses_if_applicable",
      "shoot_both_commercial_and_theatrical_sets"
    ],
    "post": [
      "narrow_to_3_5_core_selects_covering_ranges",
      "apply_minimal_retouch",
      "export_per_platform_specs",
      "embed_metadata",
      "update_profiles_consistently"
    ]
  }'::jsonb,
  '{
    "weights": {
      "eyes_in_focus_and_engaged": 0.22,
      "expression_matches_track_persona": 0.18,
      "lighting_matches_track_persona": 0.14,
      "background_simple_with_contrast": 0.10,
      "wardrobe_palette_match": 0.10,
      "retouching_minimal_natural": 0.10,
      "technical_clean_wb_exposure_noise": 0.08,
      "crop_and_composition": 0.05,
      "file_prep_correct_specs": 0.03
    },
    "pass_threshold": 0.75,
    "flags": {
      "over_editing_detected": "hard_fail",
      "busy_background_or_logo": "warn",
      "mismatch_track_or_persona": "warn"
    }
  }'::jsonb,
  '{
    "required_inputs": [
      "image",
      "declared_track (commercial|theatrical)",
      "optional_persona_id",
      "platform_target (actors_access|casting_networks|print|other)"
    ],
    "optional_manual_tags": [
      "wardrobe_color_family",
      "background_tone",
      "smile_level_0_3",
      "lighting_guess (soft_even|directional_modeled|high_key|low_key)"
    ],
    "expected_outputs": {
      "score_overall_0_1": "float",
      "scores_by_dimension": "object_matching_weights",
      "track_alignment": "pass|warn|fail",
      "persona_alignment": "pass|warn|n/a",
      "flags_triggered": ["array_of_strings"],
      "recommendations_top3": ["string", "string", "string"]
    }
  }'::jsonb,
  '{
    "why_flag_overediting": "Casting wants to meet the person in the photo. Keep skin texture and natural features.",
    "why_two_tracks": "Commercial sells approachability; Theatrical sells story depth—different lighting, palette, and energy.",
    "persona_tip": "Personas fine-tune the feel without costuming. Suggest the lane; don''t dress the character."
  }'::jsonb
);